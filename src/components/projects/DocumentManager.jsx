import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentManager({ project, canEdit }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project.id]);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newDoc = {
        name: file.name,
        url: file_url,
        type: file.type,
        uploaded_by: (await base44.auth.me()).email,
        uploaded_at: new Date().toISOString(),
      };

      const updatedDocs = [...(project.documents || []), newDoc];
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { documents: updatedDocs }
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index) => {
    if (!confirm('Delete this document?')) return;
    
    const updatedDocs = project.documents.filter((_, i) => i !== index);
    await updateProjectMutation.mutateAsync({
      id: project.id,
      data: { documents: updatedDocs }
    });
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              onClick={() => document.getElementById('file-upload').click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </label>
        </div>
      )}

      {project.documents && project.documents.length > 0 ? (
        <div className="space-y-3">
          {project.documents.map((doc, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{doc.name}</div>
                    <div className="text-xs text-slate-500">
                      Uploaded by {doc.uploaded_by} on {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          No documents uploaded yet
        </div>
      )}
    </div>
  );
}