import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Tag as TagIcon, Calendar, AlertCircle, X, Clock, PlayCircle, CheckCircle2, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    start_time: '',
    duration_minutes: 60,
    priority: 'medium',
    category: 'trabalho',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const userId = 1;

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/tasks/${userId}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      setErrorMsg('Erro de conexão ao carregar tarefas.');
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      setTasks(prev => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setNewTask({ title: '', description: '', start_time: '', duration_minutes: 60, priority: 'medium', category: 'trabalho', tags: [] });
    setTagInput('');
    setEditingTaskId(null);
    setErrorMsg('');
  };

  const openEditModal = (task) => {
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      start_time: task.start_time || '',
      duration_minutes: task.duration_minutes || 60,
      priority: task.priority || 'medium',
      category: task.category || 'trabalho',
      tags: task.tags ? task.tags.map(t => t.name) : []
    });
    setEditingTaskId(task.id);
    setIsModalOpen(true);
  };

  const confirmDelete = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      setErrorMsg('O título é obrigatório.');
      return;
    }
    setErrorMsg('');
    try {
      if (editingTaskId) {
        await axios.put(`http://localhost:3001/api/tasks/${editingTaskId}`, { ...newTask });
      } else {
        await axios.post('http://localhost:3001/api/tasks', { ...newTask, user_id: userId });
      }
      setIsModalOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      setErrorMsg('Ocorreu um erro ao salvar a tarefa no sistema.');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await axios.delete(`http://localhost:3001/api/tasks/${taskToDelete.id}`);
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      alert('Erro ao excluir tarefa.');
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await axios.put(`http://localhost:3001/api/tasks/${task.id}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !newTask.tags.includes(val)) {
        setNewTask(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewTask(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  // Cores baseadas na idade de cadastro (created_at)
  const getPostitColorByAge = (createdAt) => {
    if (!createdAt) return 'bg-[#78e367] text-slate-900'; // Verde claro para novas/recentes
    const now = new Date();
    const createdDate = new Date(createdAt);
    // Para contornar problemas de timezone, usamos a diferença absoluta em ms
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Verde claro: Mais recentes cadastradas (0 a 1 dia)
    if (diffDays <= 1) return 'bg-[#78e367] text-slate-900';
    // Amarela: Mais de 1 dia até 3 dias
    if (diffDays > 1 && diffDays <= 3) return 'bg-[#ffdc5e] text-slate-900';
    // Vermelho: Superior a 3 dias (4+)
    return 'bg-[#fd7e8b] text-slate-900';
  };

  const getDynamicStatus = (task) => {
    if (task.status === 'completed') return { label: 'Feito', color: 'bg-white/60 text-slate-700', icon: CheckCircle2 };
    
    if (!task.start_time || !task.duration_minutes) return { label: 'Pendente', color: 'bg-white/60 text-slate-700', icon: Clock };
    
    const now = new Date();
    const startTime = new Date(task.start_time);
    const endTime = new Date(startTime.getTime() + task.duration_minutes * 60000);

    if (now < startTime) {
      return { label: 'Agendado', color: 'bg-white/60 text-slate-700', icon: Calendar };
    } else if (now >= startTime && now <= endTime) {
      return { label: 'Fazendo', color: 'bg-white/80 text-amber-700 animate-pulse font-bold', icon: PlayCircle };
    } else {
      return { label: 'Atrasado', color: 'bg-rose-500 text-white font-bold', icon: AlertCircle };
    }
  };

  // ---- Drag and Drop Lógica ----
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    // Adiciona uma classe ao elemento sendo arrastado
    setTimeout(() => {
      e.target.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessário para permitir o "drop"
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('taskId');
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      let updates = {};
      const now = new Date();
      // O formato do start_time tem que manter o formato do HTML timezone, ou ISO (o backend salva ISO normal)
      // Ajuste de fuso horário local
      const localISO = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

      if (targetColumn === 'Feito') {
        updates = { status: 'completed' };
      } else if (targetColumn === 'Fazendo') {
        // Para entrar na janela de "Fazendo", colocamos o start_time como agora
        updates = { status: 'pending', start_time: localISO };
      } else if (targetColumn === 'AFazer') {
        // Apenas remove de concluído se estiver lá
        updates = { status: 'pending' };
      }

      // Evita chamadas desnecessárias se não houver mudanças reais
      if (Object.keys(updates).length > 0) {
        // Atualiza a UI imediatamente de forma otimista
        setTasks(prevTasks => prevTasks.map(t => {
          if (t.id === taskId) {
            return { ...t, ...updates };
          }
          return t;
        }));
        
        await axios.put(`http://localhost:3001/api/tasks/${taskId}`, updates);
        fetchTasks(); // Garante os dados frescos do backend
      }
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      fetchTasks(); // Reverte a UI em caso de erro
    }
  };

  const renderTaskCard = (task) => {
    const postitColor = getPostitColorByAge(task.created_at);
    const isCompleted = task.status === 'completed';
    
    return (
      <div 
        key={task.id} 
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        className={`${postitColor} w-full max-w-[180px] mx-auto cursor-grab active:cursor-grabbing p-4 transition-all flex flex-col relative group shrink-0`}
        style={{ aspectRatio: '1/1' }} // Post-its quadrados exatos como no template
      >
        {isCompleted ? (
          // Se estiver Feito, exibe o checkmark gigante do template
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-16 h-16 text-slate-900">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ) : null}

        <div className={`flex justify-between items-start gap-2 h-full ${isCompleted ? 'opacity-20' : ''}`}>
          <div className="flex-1 min-w-0">
            {/* O template usa "linhas", vamos mostrar o título e 3 linhas simbólicas decorativas */}
            <h3 className="font-bold text-slate-900 break-words leading-tight line-clamp-2">
              {task.title}
            </h3>
            
            {!isCompleted && (
              <div className="space-y-1.5 mt-3">
                <div className="h-1 w-3/4 bg-slate-900/60 rounded"></div>
                <div className="h-1 w-full bg-slate-900/60 rounded"></div>
                <div className="h-1 w-2/3 bg-slate-900/60 rounded"></div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative z-10">
            <button onClick={() => handleToggleStatus(task)} className="p-1 text-slate-900 hover:bg-black/10 rounded" title={isCompleted ? 'Desmarcar' : 'Concluir'}>
               <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => openEditModal(task)} className="p-1 text-slate-900 hover:bg-black/10 rounded" title="Editar">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => confirmDelete(task)} className="p-1 text-slate-900 hover:bg-black/10 rounded" title="Excluir">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tasksAFazer = tasks.filter(t => {
    const st = getDynamicStatus(t).label;
    return st === 'Agendado' || st === 'Pendente';
  });

  const tasksFazendo = tasks.filter(t => getDynamicStatus(t).label === 'Fazendo');
  const tasksAtrasadas = tasks.filter(t => getDynamicStatus(t).label === 'Atrasado');
  const tasksFeitas = tasks.filter(t => getDynamicStatus(t).label === 'Feito');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Quadro de Tarefas</h2>
          <p className="text-slate-400 mt-1">Sua parede de Post-its interativa. Arraste para organizar!</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm border border-white/10"
        >
          <Plus className="w-5 h-5" />
          Novo Post-it
        </button>
      </div>

      {/* Kanban Board Grid com Drag and Drop no formato do Template */}
      <div className="border border-white/20 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 flex-1 min-h-0 items-start">
        
        {/* Coluna A Fazer */}
        <div 
          className="flex flex-col h-full border-b xl:border-b-0 xl:border-r border-white/20 px-4 max-h-[75vh] overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'AFazer')}
        >
          <h3 className="font-bold text-white text-center mb-6">A Fazer</h3>
          <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            <div className="flex flex-col gap-6 pt-4">
              {tasksAFazer.length === 0 ? <p className="text-sm text-slate-500 text-center col-span-2 mt-4">Vazio</p> : tasksAFazer.map(renderTaskCard)}
            </div>
          </div>
        </div>

        {/* Coluna Fazendo */}
        <div 
          className="flex flex-col h-full border-b xl:border-b-0 xl:border-r border-white/20 px-4 max-h-[75vh] overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'Fazendo')}
        >
          <h3 className="font-bold text-white text-center mb-6">Fazendo</h3>
          <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
             <div className="flex flex-col gap-6 pt-4">
              {tasksFazendo.length === 0 ? <p className="text-sm text-slate-500 text-center col-span-2 mt-4">Vazio</p> : tasksFazendo.map(renderTaskCard)}
             </div>
          </div>
        </div>

        {/* Coluna Atrasadas */}
        <div className="flex flex-col h-full border-b xl:border-b-0 xl:border-r border-white/20 px-4 max-h-[75vh] overflow-hidden">
          <h3 className="font-bold text-white text-center mb-6">Atrasadas</h3>
          <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            <div className="flex flex-col gap-6 pt-4">
              {tasksAtrasadas.length === 0 ? <p className="text-sm text-slate-500 text-center col-span-2 mt-4">Vazio</p> : tasksAtrasadas.map(renderTaskCard)}
            </div>
          </div>
        </div>

        {/* Coluna Feito */}
        <div 
          className="flex flex-col h-full px-4 max-h-[75vh] overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'Feito')}
        >
          <h3 className="font-bold text-white text-center mb-6">Feito</h3>
          <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            <div className="flex flex-col gap-6 pt-4">
              {tasksFeitas.length === 0 ? <p className="text-sm text-slate-500 text-center col-span-2 mt-4">Vazio</p> : tasksFeitas.map(renderTaskCard)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="glass-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden slide-in-from-bottom-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-white">{editingTaskId ? 'Editar Post-it' : 'Criar Novo Post-it'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {errorMsg && (
              <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSaveTask} className="p-6 space-y-5 overflow-y-auto text-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={e => { setNewTask({...newTask, title: e.target.value}); setErrorMsg(''); }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-white ${errorMsg && !newTask.title ? 'border-rose-400 ring-1 ring-rose-400' : 'border-white/10'}`}
                  placeholder="Ex: Reunião com cliente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none text-white"
                  rows="2"
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Horário de Início</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={newTask.start_time}
                    onChange={e => setNewTask({...newTask, start_time: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duração (minutos)</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={newTask.duration_minutes}
                    onChange={e => setNewTask({...newTask, duration_minutes: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Prioridade</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white [&>option]:bg-slate-800"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Cor do Post-it</label>
                  <select 
                    value={newTask.category}
                    onChange={e => setNewTask({...newTask, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-white [&>option]:bg-slate-800"
                  >
                    <option value="trabalho">Amarelo (Trabalho)</option>
                    <option value="casa">Rosa (Casa)</option>
                    <option value="estudos">Verde (Estudos)</option>
                    <option value="pessoal">Azul (Pessoal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Tags <span className="text-slate-500 font-normal text-xs">(Pressione Enter)</span>
                </label>
                <div className="p-2 border border-white/10 rounded-xl bg-white/5 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow flex flex-wrap gap-2">
                  {newTask.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-white/10 text-white text-sm font-medium px-2 py-1 rounded-lg border border-white/10">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder={newTask.tags.length === 0 ? "Ex: urgente, projeto..." : "Mais..."}
                    className="flex-1 min-w-[100px] outline-none bg-transparent text-sm py-1 px-1 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg"
                >
                  {editingTaskId ? 'Atualizar Post-it' : 'Salvar Post-it'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="glass-card rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden slide-in-from-bottom-8 p-6 text-center border border-white/10">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Amassar Post-it?</h3>
            <p className="text-slate-400 mb-6">
              Você tem certeza que deseja jogar fora <strong>"{taskToDelete?.title}"</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-white/10 transition-colors flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteTask}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-lg flex-1 border border-rose-500/50"
              >
                Sim, Jogar Fora
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}
