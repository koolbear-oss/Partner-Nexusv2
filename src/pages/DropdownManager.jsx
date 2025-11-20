import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Plus, Pencil, Save, X, ArrowUp, ArrowDown } from 'lucide-react';

export default function DropdownManager() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ label: '', value: '', description: '', color: '' });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: dropdownValues = [] } = useQuery({
    queryKey: ['dropdownValues'],
    queryFn: () => base44.entities.DropdownValue.list(),
  });

  const updateSolutionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Solution.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['solutions']);
      setEditingItem(null);
    },
  });

  const createSolutionMutation = useMutation({
    mutationFn: (data) => base44.entities.Solution.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['solutions']);
      setNewItem({ label: '', value: '', description: '', color: '' });
    },
  });

  const updateVerticalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vertical.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['verticals']);
      setEditingItem(null);
    },
  });

  const createVerticalMutation = useMutation({
    mutationFn: (data) => base44.entities.Vertical.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['verticals']);
      setNewItem({ label: '', value: '', description: '', color: '' });
    },
  });

  const updateDropdownMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DropdownValue.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dropdownValues']);
      setEditingItem(null);
    },
  });

  const createDropdownMutation = useMutation({
    mutationFn: (data) => base44.entities.DropdownValue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dropdownValues']);
      setNewItem({ label: '', value: '', description: '', color: '' });
    },
  });

  const toggleActive = (type, item) => {
    if (type === 'solution') {
      updateSolutionMutation.mutate({ id: item.id, data: { active: !item.active } });
    } else if (type === 'vertical') {
      updateVerticalMutation.mutate({ id: item.id, data: { active: !item.active } });
    } else {
      updateDropdownMutation.mutate({ id: item.id, data: { active: !item.active } });
    }
  };

  const updateOrder = (category, item, direction) => {
    const categoryItems = dropdownValues.filter(d => d.category === category).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const currentIndex = categoryItems.findIndex(d => d.id === item.id);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === categoryItems.length - 1)) return;
    
    const newOrder = direction === 'up' ? (item.display_order || 0) - 1 : (item.display_order || 0) + 1;
    updateDropdownMutation.mutate({ id: item.id, data: { display_order: newOrder } });
  };

  const renderSolutionsList = () => (
    <div className="space-y-2">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Solution Name"
              value={newItem.label}
              onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
            />
            <Input
              placeholder="Code"
              value={newItem.value}
              onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
            />
            <Button
              onClick={() => createSolutionMutation.mutate({ 
                name: newItem.label, 
                code: newItem.value,
                active: true,
                category: 'physical_security'
              })}
              disabled={!newItem.label || !newItem.value || createSolutionMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Solution
            </Button>
          </div>
        </CardContent>
      </Card>

      {solutions.map((item) => (
        <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
          <CardContent className="pt-4">
            {editingItem?.id === item.id ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
                <Input
                  value={editingItem.code}
                  onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateSolutionMutation.mutate({ id: item.id, data: editingItem })} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-500">Code: {item.code}</div>
                  </div>
                  <Badge className={item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {item.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive('solution', item)}>
                    {item.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderVerticalsList = () => (
    <div className="space-y-2">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Vertical Name"
              value={newItem.label}
              onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
            />
            <Input
              placeholder="Code"
              value={newItem.value}
              onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
            />
            <Button
              onClick={() => createVerticalMutation.mutate({ 
                name: newItem.label, 
                code: newItem.value,
                active: true
              })}
              disabled={!newItem.label || !newItem.value || createVerticalMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vertical
            </Button>
          </div>
        </CardContent>
      </Card>

      {verticals.map((item) => (
        <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
          <CardContent className="pt-4">
            {editingItem?.id === item.id ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
                <Input
                  value={editingItem.code}
                  onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateVerticalMutation.mutate({ id: item.id, data: editingItem })} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-500">Code: {item.code}</div>
                  </div>
                  <Badge className={item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {item.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive('vertical', item)}>
                    {item.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDropdownList = (category, title) => {
    const items = dropdownValues.filter(d => d.category === category).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    return (
      <div className="space-y-2">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Label"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
              />
              <Input
                placeholder="Value"
                value={newItem.value}
                onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
              />
              <Input
                placeholder="Color (optional)"
                value={newItem.color}
                onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
              />
              <Button
                onClick={() => createDropdownMutation.mutate({ 
                  category,
                  label: newItem.label,
                  value: newItem.value,
                  color: newItem.color || undefined,
                  active: true,
                  display_order: items.length
                })}
                disabled={!newItem.label || !newItem.value || createDropdownMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {items.map((item) => (
          <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
            <CardContent className="pt-4">
              {editingItem?.id === item.id ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    value={editingItem.label}
                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                  />
                  <Input
                    value={editingItem.value}
                    onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                  />
                  <Input
                    placeholder="Color"
                    value={editingItem.color || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateDropdownMutation.mutate({ id: item.id, data: editingItem })} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateOrder(category, item, 'up')} className="h-5 px-1">
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateOrder(category, item, 'down')} className="h-5 px-1">
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className="text-sm text-slate-500">Value: {item.value}</div>
                    </div>
                    {item.color && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                      </div>
                    )}
                    <Badge className={item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive('dropdown', item)}>
                      {item.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dropdown Manager</h1>
        <p className="text-slate-600 mt-2">
          Manage all dropdown values across the platform. Changes create new options without affecting existing data.
        </p>
      </div>

      <Tabs defaultValue="solutions" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="verticals">Verticals</TabsTrigger>
          <TabsTrigger value="partner_type">Partner Types</TabsTrigger>
          <TabsTrigger value="partner_tier">Partner Tiers</TabsTrigger>
          <TabsTrigger value="service_type">Services</TabsTrigger>
          <TabsTrigger value="project_phase">Project Phases</TabsTrigger>
          <TabsTrigger value="competency_level">Competency Levels</TabsTrigger>
          <TabsTrigger value="product_group">Product Groups</TabsTrigger>
          <TabsTrigger value="project_type">Project Types</TabsTrigger>
        </TabsList>

        <TabsContent value="solutions">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Solution Types</CardTitle>
              <p className="text-sm text-slate-600">Manage solution categories for partners and projects</p>
            </CardHeader>
            <CardContent>{renderSolutionsList()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verticals">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Vertical Markets</CardTitle>
              <p className="text-sm text-slate-600">Manage vertical market categories</p>
            </CardHeader>
            <CardContent>{renderVerticalsList()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partner_type">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Partner Types</CardTitle>
              <p className="text-sm text-slate-600">Define partner classifications</p>
            </CardHeader>
            <CardContent>{renderDropdownList('partner_type', 'Partner Types')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partner_tier">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Partner Tiers</CardTitle>
              <p className="text-sm text-slate-600">Manage partnership tier levels</p>
            </CardHeader>
            <CardContent>{renderDropdownList('partner_tier', 'Partner Tiers')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service_type">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Service Types</CardTitle>
              <p className="text-sm text-slate-600">Services offered by partners</p>
            </CardHeader>
            <CardContent>{renderDropdownList('service_type', 'Service Types')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project_phase">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Phases</CardTitle>
              <p className="text-sm text-slate-600">Define project lifecycle phases</p>
            </CardHeader>
            <CardContent>{renderDropdownList('project_phase', 'Project Phases')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competency_level">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Competency Levels</CardTitle>
              <p className="text-sm text-slate-600">Skill level classifications</p>
            </CardHeader>
            <CardContent>{renderDropdownList('competency_level', 'Competency Levels')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product_group">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Product Groups</CardTitle>
              <p className="text-sm text-slate-600">ASSA ABLOY product categories</p>
            </CardHeader>
            <CardContent>{renderDropdownList('product_group', 'Product Groups')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project_type">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Types</CardTitle>
              <p className="text-sm text-slate-600">Define project type categories</p>
            </CardHeader>
            <CardContent>{renderDropdownList('project_type', 'Project Types')}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <div className="text-amber-900 text-sm">
            <strong>Note:</strong> Editing values creates new options. Historical data retains original values until manually updated. Use arrows to reorder items.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}