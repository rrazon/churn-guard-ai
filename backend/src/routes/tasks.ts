import express from 'express';
import { database } from '../services/database';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req: AuthRequest, res) => {
  try {
    const { 
      assigned_to, 
      status, 
      priority,
      customer_id,
      page = '1', 
      limit = '50' 
    } = req.query;
    
    let tasks = database.tasks;
    
    if (assigned_to) {
      tasks = tasks.filter(t => t.assigned_to === assigned_to);
    }
    
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }
    
    if (customer_id) {
      tasks = tasks.filter(t => t.customer_id === customer_id);
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const sortedTasks = tasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    
    const paginatedTasks = sortedTasks.slice(startIndex, endIndex);
    
    const tasksWithCustomers = paginatedTasks.map(task => {
      const customer = database.customers.find(c => c.id === task.customer_id);
      return {
        ...task,
        customer_name: customer?.company_name || 'Unknown'
      };
    });
    
    res.json({
      tasks: tasksWithCustomers,
      total: tasks.length,
      page: pageNum,
      totalPages: Math.ceil(tasks.length / limitNum)
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const {
      customer_id,
      title,
      description,
      task_type,
      priority,
      due_date,
      estimated_time_hours
    } = req.body;
    
    if (!customer_id || !title || !task_type || !priority || !due_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const customer = database.customers.find(c => c.id === customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const task = {
      id: uuidv4(),
      customer_id,
      assigned_to: req.user?.name || 'Unknown',
      title,
      description: description || '',
      task_type,
      priority,
      status: 'pending' as const,
      due_date: new Date(due_date),
      estimated_time_hours: estimated_time_hours || 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    database.tasks.push(task);
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, priority, due_date, title, description, estimated_time_hours } = req.body;
    
    const taskIndex = database.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = database.tasks[taskIndex];
    
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (due_date) task.due_date = new Date(due_date);
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (estimated_time_hours) task.estimated_time_hours = estimated_time_hours;
    task.updated_at = new Date();
    
    database.tasks[taskIndex] = task;
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const taskIndex = database.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    database.tasks.splice(taskIndex, 1);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.get('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const task = database.tasks.find(t => t.id === id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const customer = database.customers.find(c => c.id === task.customer_id);
    
    res.json({
      ...task,
      customer_name: customer?.company_name || 'Unknown'
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

export default router;
