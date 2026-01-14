import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Task component
const TaskItem = ({ task, onEdit, onDelete, onToggleComplete, onDragStart, onDragOver, onDrop, index, isDragging }) => {
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const priorityColors = {
    high: '#ff6b6b',
    medium: '#ffa94d',
    low: '#51cf66'
  };

  return (
    <div 
      className={`task-item ${task.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        borderLeft: `4px solid ${priorityColors[task.priority || 'medium']}`,
        opacity: task.completed ? 0.7 : 1
      }}
    >
      <div className="task-item-content">
        <div className="task-checkbox-container">
          <div 
            className={`custom-checkbox ${task.completed ? 'checked' : ''}`}
            onClick={() => onToggleComplete(task.id)}
            aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
          >
            {task.completed && (
              <svg className="checkmark" viewBox="0 0 12 10">
                <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
              </svg>
            )}
          </div>
        </div>
        
        <div className="task-main-content" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="task-header">
            <h4 className={`task-title ${task.completed ? 'strikethrough' : ''}`}>
              {task.title}
            </h4>
            <div className="task-meta">
              {task.dueDate && (
                <span className="due-date">
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                  </svg>
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                {task.priority || 'medium'} priority
              </span>
            </div>
          </div>
          
          {task.description && (
            <div className={`task-description ${isExpanded ? 'expanded' : 'collapsed'}`}>
              <p>{task.description}</p>
              {task.description.length > 100 && !isExpanded && (
                <span className="expand-hint">...click to expand</span>
              )}
            </div>
          )}
          
          <div className="task-footer">
            <div className="task-tags">
              {task.tags && task.tags.map((tag, idx) => (
                <span key={idx} className="task-tag" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                  {tag.name}
                </span>
              ))}
            </div>
            <span className="task-date">
              {new Date(task.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        
        <div className={`task-actions ${showActions ? 'visible' : ''}`}>
          <button 
            className="action-btn edit-btn"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
          >
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState('#4b6cb7');
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showCompleted, setShowCompleted] = useState(true);
  
  const toastTimeout = useRef(null);

  const tagColors = [
    '#4b6cb7', '#ff6b6b', '#51cf66', '#ffa94d', 
    '#7950f2', '#20c997', '#f06595', '#5c7cfa'
  ];

  // Load tasks from localStorage
  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('tasks'));
    if (storedTasks) {
      setTasks(storedTasks);
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Show toast notification
  const showNotification = (message, type = 'success') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    
    setShowToast({ show: true, message, type });
    
    toastTimeout.current = setTimeout(() => {
      setShowToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.some(tag => tag.name === tagInput.trim())) {
      const newTag = {
        name: tagInput.trim(),
        color: tagColor
      };
      setTags([...tags, newTag]);
      setTagInput('');
      showNotification(`Tag "${tagInput}" added`, 'info');
    }
  };

  // Remove tag
  const removeTag = (tagName) => {
    setTags(tags.filter(tag => tag.name !== tagName));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showNotification('Task title is required', 'error');
      return;
    }
    
    const taskData = {
      title,
      description,
      dueDate,
      priority,
      tags,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (editingId) {
      // Update existing task
      setTasks(tasks.map(task => 
        task.id === editingId 
          ? { ...task, ...taskData, id: editingId } 
          : task
      ));
      showNotification('Task updated successfully', 'success');
      setEditingId(null);
    } else {
      // Add new task
      const newTask = {
        ...taskData,
        id: Date.now().toString()
      };
      setTasks([newTask, ...tasks]);
      showNotification('Task added successfully', 'success');
    }
    
    // Reset form
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setTags([]);
    setTagInput('');
  };

  // Handle task deletion
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== id));
      showNotification('Task deleted', 'error');
    }
  };

  // Handle task editing
  const handleEdit = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate || '');
    setPriority(task.priority || 'medium');
    setTags(task.tags || []);
    setEditingId(task.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification('Editing task...', 'info');
  };

  // Toggle task completion
  const toggleComplete = (id) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { 
            ...task, 
            completed: !task.completed,
            updatedAt: new Date().toISOString(),
            completedAt: !task.completed ? new Date().toISOString() : null
          } 
        : task
    ));
    showNotification('Task status updated', 'info');
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);
    
    setTasks(newTasks);
    setDraggedIndex(null);
    setDragOverIndex(null);
    showNotification('Task order updated', 'info');
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      // Filter by completion
      if (!showCompleted && task.completed) return false;
      
      // Filter by status
      if (filter === 'completed') return task.completed;
      if (filter === 'pending') return !task.completed;
      
      // Filter by priority
      if (filter === 'high' && task.priority !== 'high') return false;
      if (filter === 'medium' && task.priority !== 'medium') return false;
      if (filter === 'low' && task.priority !== 'low') return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags?.some(tag => tag.name.toLowerCase().includes(query))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      } else if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  // Statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length
  };

  const completionPercentage = tasks.length > 0 
    ? Math.round((stats.completed / tasks.length) * 100) 
    : 0;

  // Clear all tasks
  const clearAllTasks = () => {
    if (tasks.length === 0) return;
    
    if (window.confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) {
      setTasks([]);
      showNotification('All tasks deleted', 'error');
    }
  };

  return (
    <div className="app">
      {/* Toast Notification */}
      {showToast.show && (
        <div className={`toast-notification ${showToast.type}`}>
          <span className="toast-message">{showToast.message}</span>
          <button 
            className="toast-close"
            onClick={() => setShowToast({ show: false, message: '', type: '' })}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
            <div className="app-title">
              <h1>TaskFlow Pro</h1>
              <p>Manage your workflow efficiently</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="search-bar">
              <svg className="search-icon" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
              </button>
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-label">
            <span>Completion Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3>Add New Task</h3>
              <form onSubmit={handleSubmit} className="task-form">
                <div className="form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details..."
                    rows="3"
                    className="form-textarea"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Priority</label>
                    <div className="priority-selector">
                      {['high', 'medium', 'low'].map(p => (
                        <button
                          key={p}
                          type="button"
                          className={`priority-option ${priority === p ? 'selected' : ''} ${p}`}
                          onClick={() => setPriority(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Tags</label>
                  <div className="tags-input">
                    <div className="tags-container">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="tag" style={{ backgroundColor: tag.color }}>
                          {tag.name}
                          <button 
                            type="button"
                            className="tag-remove"
                            onClick={() => removeTag(tag.name)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-row">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag..."
                        className="tag-input"
                      />
                      <div className="color-picker">
                        {tagColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`color-option ${tagColor === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setTagColor(color)}
                          />
                        ))}
                      </div>
                      <button 
                        type="button"
                        className="btn-add-tag"
                        onClick={addTag}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editingId ? (
                      <>
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        Update Task
                      </>
                    ) : (
                      <>
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Add Task
                      </>
                    )}
                  </button>
                  
                  {editingId && (
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => {
                        setEditingId(null);
                        resetForm();
                        showNotification('Edit cancelled', 'info');
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="sidebar-section">
              <h3>Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.pending}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.completed}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.high}</div>
                  <div className="stat-label">High Priority</div>
                </div>
              </div>
            </div>
            
            <div className="sidebar-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button 
                  className="action-btn danger"
                  onClick={clearAllTasks}
                  disabled={tasks.length === 0}
                >
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Clear All Tasks
                </button>
                <button 
                  className="action-btn"
                  onClick={() => {
                    setShowCompleted(!showCompleted);
                    showNotification(
                      showCompleted ? "Hiding completed tasks" : "Showing all tasks",
                      'info'
                    );
                  }}
                >
                  <svg className="icon" viewBox="0 0 24 24">
                    {showCompleted ? (
                      <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                    ) : (
                      <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    )}
                  </svg>
                  {showCompleted ? "Hide Completed" : "Show All"}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="content-header">
            <div className="filters-container">
              <div className="filter-group">
                <h4>Filter by Status</h4>
                <div className="filter-buttons">
                  {['all', 'pending', 'completed'].map(f => (
                    <button
                      key={f}
                      className={`filter-btn ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <h4>Filter by Priority</h4>
                <div className="filter-buttons">
                  {['all', 'high', 'medium', 'low'].map(p => (
                    <button
                      key={p}
                      className={`filter-btn priority ${filter === p ? 'active' : ''} ${p}`}
                      onClick={() => setFilter(p)}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <h4>Sort by</h4>
                <select 
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date Created</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="tasks-container">
            <div className="tasks-header">
              <h2>
                {filter === 'all' ? 'All Tasks' : 
                 filter === 'completed' ? 'Completed Tasks' : 
                 filter === 'pending' ? 'Pending Tasks' :
                 `${filter.charAt(0).toUpperCase() + filter.slice(1)} Priority Tasks`}
                <span className="task-count">({filteredAndSortedTasks.length})</span>
              </h2>
              
              {filteredAndSortedTasks.length > 0 && (
                <div className="drag-hint">
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z"/>
                  </svg>
                  Drag tasks to reorder
                </div>
              )}
            </div>
            
            {filteredAndSortedTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-illustration">
                  <svg className="illustration" viewBox="0 0 200 200">
                    <path fill="#E8EAF6" d="M100,50 L150,100 L100,150 L50,100 Z" />
                    <path fill="#C5CAE9" d="M100,60 L140,100 L100,140 L60,100 Z" />
                    <circle cx="100" cy="100" r="30" fill="#7986CB" />
                    <path fill="#3F51B5" d="M95,95 L105,95 L105,105 L95,105 Z" />
                  </svg>
                </div>
                <h3>No tasks found</h3>
                <p>
                  {searchQuery 
                    ? `No tasks match "${searchQuery}"` 
                    : filter !== 'all' 
                      ? `No ${filter} tasks` 
                      : "Add your first task to get started!"}
                </p>
                {searchQuery && (
                  <button 
                    className="btn-secondary"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className={`tasks-view ${viewMode}`}>
                {filteredAndSortedTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleComplete={toggleComplete}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragging={draggedIndex === index}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>TaskFlow Pro • {stats.total} tasks • {completionPercentage}% complete</p>
            <p className="footer-note">
              Drag tasks to reorder • Double-click to expand • Hover for actions
            </p>
          </div>
          <div className="footer-actions">
            <button 
              className="footer-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Scroll to Top
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;