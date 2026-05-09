import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, User as UserIcon, Mail, Camera, Check, X } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const userId = 1; // Fixo no momento

  const fetchUser = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      setUser(response.data);
      setNewAvatarUrl(response.data.avatar || '');
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = () => {
    alert('Sistema de login ainda não implementado! Redirecionando para login falso...');
  };

  const handleSaveAvatar = async () => {
    try {
      await axios.put(`/api/users/${userId}`, { avatar: newAvatarUrl });
      setIsEditingAvatar(false);
      fetchUser();
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Carregando perfil...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Meu Perfil</h2>
        <p className="text-slate-500 mt-2">Gerencie suas informações pessoais e preferências.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 mb-6 gap-4">
            
            <div className="flex flex-col items-start gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-sm">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <UserIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
                {!isEditingAvatar && (
                  <button 
                    onClick={() => setIsEditingAvatar(true)}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors"
                    title="Mudar Foto"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isEditingAvatar && (
                <div className="flex flex-col gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 w-full max-w-sm">
                  <label className="text-xs font-semibold text-slate-600">URL da Nova Foto</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={newAvatarUrl}
                      onChange={e => setNewAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleSaveAvatar} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200" title="Salvar">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsEditingAvatar(false); setNewAvatarUrl(user.avatar || ''); }} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300" title="Cancelar">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">Dica: Use um link de imagem válida.</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleLogout}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{user.name}</h3>
              <div className="flex items-center gap-2 text-slate-500 mt-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>
            
            <hr className="border-slate-100" />
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Informações da Conta</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">ID do Usuário</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">#{user.id}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Plano</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">Gratuito</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
