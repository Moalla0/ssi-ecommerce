"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2 } from "lucide-react";
import { addTodo, deleteTodo, getTodos, setTodoCompleted, TodoItem } from "@/lib/todos";
import { toast } from "sonner";

const TodoList = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTodos();
        setTodos(data);
      } catch (e) {
        setTodos([]);
      }
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!newTodo.trim() || isAdding) {
      if (!newTodo.trim()) {
        toast.error('Please enter a todo text');
      }
      return;
    }
    
    setIsAdding(true);
    
    // Optimistically add the todo to the UI immediately
    const tempTodo: TodoItem = {
      id: `temp-${Date.now()}`,
      text: newTodo.trim(),
      completed: false,
      dateKey: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setTodos((prev) => [tempTodo, ...prev]);
    setNewTodo("");
    
    try {
      // Actually save to database
      const created = await addTodo(newTodo, tempTodo.dateKey);
      
      // Replace the temp todo with the real one
      setTodos((prev) => prev.map(todo => 
        todo.id === tempTodo.id ? created : todo
      ));
      toast.success('Todo added successfully!');
    } catch (error) {
      // If saving failed, remove the temp todo
      setTodos((prev) => prev.filter(todo => todo.id !== tempTodo.id));
      console.error('Failed to save todo:', error);
      toast.error('Failed to save todo. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: string, checked: boolean) => {
    try {
      await setTodoCompleted(id, checked);
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: checked } : t)));
      toast.success(`Todo ${checked ? 'marked as completed' : 'marked as incomplete'}!`);
    } catch (error) {
      console.error('Failed to update todo status:', error);
      toast.error('Failed to update todo status. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      toast.success('Todo deleted successfully!');
    } catch (error) {
      console.error('Failed to delete todo:', error);
      toast.error('Failed to delete todo. Please try again.');
    }
  };

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Todo List</h1>
      
      {/* Add */}
      <div className="flex gap-2 mt-4">
        <Input
          placeholder={isAdding ? "Saving..." : "Add a todo..."}
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={isAdding}
          className={isAdding ? "opacity-50" : ""}
        />
        <Button onClick={handleAdd} disabled={isAdding || !newTodo.trim()}>
          {isAdding ? 'Adding...' : 'Add'}
        </Button>
      </div>

      {/* LIST */}
      <ScrollArea className="max-h-[400px] mt-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {todos.map((item) => (
            <Card key={item.id} className={`p-4 ${item.id?.startsWith('temp-') ? 'opacity-75' : ''}`}>
              <div className="flex items-center gap-4">
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={(c) => handleToggle(item.id!, Boolean(c))}
                  disabled={item.id?.startsWith('temp-')}
                />
                <label htmlFor={item.id} className="text-sm text-muted-foreground flex-1">
                  {item.text}
                  {item.id?.startsWith('temp-') && (
                    <span className="ml-2 text-xs text-blue-500">(saving...)</span>
                  )}
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(item.id!)}
                  disabled={item.id?.startsWith('temp-')}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {todos.length === 0 && (
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">No todos yet.</div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TodoList;
