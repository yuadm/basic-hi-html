
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ComplianceTask {
  id: string;
  name: string;
  frequency: string;
  created_at: string;
}

export function ComplianceTaskManagement() {
  const [complianceTasks, setComplianceTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingComplianceTask, setEditingComplianceTask] = useState<ComplianceTask | null>(null);
  const [newTask, setNewTask] = useState({ name: "", frequency: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchComplianceTasks();
  }, []);

  const fetchComplianceTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_tasks')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching compliance tasks:', error);
        return;
      }

      setComplianceTasks(data || []);
    } catch (error) {
      console.error('Error fetching compliance tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComplianceTask = async () => {
    if (!newTask.name.trim() || !newTask.frequency) return;

    try {
      const { data, error } = await supabase
        .from('compliance_tasks')
        .insert([{ name: newTask.name, frequency: newTask.frequency }])
        .select()
        .single();

      if (error) {
        console.error('Error adding compliance task:', error);
        toast({
          title: "Error",
          description: "Failed to add compliance task",
          variant: "destructive",
        });
        return;
      }

      setComplianceTasks([...complianceTasks, data]);
      setNewTask({ name: "", frequency: "" });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Compliance task added successfully",
      });
    } catch (error) {
      console.error('Error adding compliance task:', error);
      toast({
        title: "Error",
        description: "Failed to add compliance task",
        variant: "destructive",
      });
    }
  };

  const handleEditComplianceTask = async () => {
    if (!editingComplianceTask || !editingComplianceTask.name.trim() || !editingComplianceTask.frequency) return;

    try {
      const { error } = await supabase
        .from('compliance_tasks')
        .update({ name: editingComplianceTask.name, frequency: editingComplianceTask.frequency })
        .eq('id', editingComplianceTask.id);

      if (error) {
        console.error('Error updating compliance task:', error);
        toast({
          title: "Error",
          description: "Failed to update compliance task",
          variant: "destructive",
        });
        return;
      }

      setComplianceTasks(complianceTasks.map(task => 
        task.id === editingComplianceTask.id ? editingComplianceTask : task
      ));
      setEditingComplianceTask(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Compliance task updated successfully",
      });
    } catch (error) {
      console.error('Error updating compliance task:', error);
      toast({
        title: "Error",
        description: "Failed to update compliance task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComplianceTask = async (complianceTaskId: string) => {
    if (!confirm('Are you sure you want to delete this compliance task?')) return;

    try {
      const { error } = await supabase
        .from('compliance_tasks')
        .delete()
        .eq('id', complianceTaskId);

      if (error) {
        console.error('Error deleting compliance task:', error);
        toast({
          title: "Error",
          description: "Failed to delete compliance task",
          variant: "destructive",
        });
        return;
      }

      setComplianceTasks(complianceTasks.filter(task => task.id !== complianceTaskId));
      toast({
        title: "Success",
        description: "Compliance task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting compliance task:', error);
      toast({
        title: "Error",
        description: "Failed to delete compliance task",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading compliance tasks...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Compliance Tasks</h4>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {complianceTasks.length > 0 ? (
            complianceTasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">{task.name}</h5>
                  <span className="text-sm px-2 py-1 bg-muted rounded-md">{task.frequency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingComplianceTask(task);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteComplianceTask(task.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No compliance tasks found. Add your first task to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add Compliance Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Compliance Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter task name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-frequency">Frequency</Label>
              <Select value={newTask.frequency} onValueChange={(value) => setNewTask(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddComplianceTask} disabled={!newTask.name.trim() || !newTask.frequency}>
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Compliance Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Compliance Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-name">Task Name</Label>
              <Input
                id="edit-task-name"
                value={editingComplianceTask?.name || ""}
                onChange={(e) => setEditingComplianceTask(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter task name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-frequency">Frequency</Label>
              <Select 
                value={editingComplianceTask?.frequency || ""} 
                onValueChange={(value) => setEditingComplianceTask(prev => prev ? { ...prev, frequency: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditComplianceTask} disabled={!editingComplianceTask?.name.trim() || !editingComplianceTask?.frequency}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
