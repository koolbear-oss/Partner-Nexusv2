import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function CommentSection({ project, canComment }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project.id]);
      setNewComment('');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const user = await base44.auth.me();
    const comment = {
      author: user.full_name || user.email,
      text: newComment,
      timestamp: new Date().toISOString(),
    };

    const updatedComments = [...(project.comments || []), comment];
    await updateProjectMutation.mutateAsync({
      id: project.id,
      data: { comments: updatedComments }
    });
  };

  return (
    <div className="space-y-4">
      {canComment && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || updateProjectMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </form>
        </Card>
      )}

      {project.comments && project.comments.length > 0 ? (
        <div className="space-y-3">
          {[...project.comments].reverse().map((comment, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center">
                  {comment.author.charAt(0).toUpperCase()}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{comment.author}</span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(comment.timestamp), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          No comments yet
        </div>
      )}
    </div>
  );
}