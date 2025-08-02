import { useState, useEffect } from 'react';
import { getReservationComments, addReservationComment, updateReservationComment, getReservationMainComment, ReservationComment } from '@/actions/reservations/comments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit2, Save, X, CheckCircle } from 'lucide-react';

interface ReservationCommentsTabProps {
  reservationId: number;
  user: { name?: string; email: string };
}

export default function ReservationCommentsTab({ reservationId, user }: ReservationCommentsTabProps) {
  const [comments, setComments] = useState<ReservationComment[]>([]);
  const [mainComment, setMainComment] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line
  }, [reservationId]);

  const loadComments = async () => {
    try {
      const [commentsData, mainCommentData] = await Promise.all([
        getReservationComments(reservationId),
        getReservationMainComment(reservationId)
      ]);
      setComments(commentsData);
      setMainComment(mainCommentData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const author = user.name || user.email;
      const success = await addReservationComment(reservationId, newComment, author);
      if (success) {
        setNewComment('');
        await loadComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (comment: ReservationComment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (!editingText.trim() || !editingCommentId) return;
    
    setEditLoading(true);
    try {
      const updatedBy = user.name || user.email;
      const success = await updateReservationComment(editingCommentId, editingText, updatedBy);
      if (success) {
        setEditingCommentId(null);
        setEditingText('');
        await loadComments();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      {mainComment && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Comentario Principal</h4>
          <div className="bg-gray-50 p-3 rounded text-xs text-gray-800">{mainComment}</div>
        </div>
      )}
      {comments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Comentarios Adicionales ({comments.length})</h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-blue-50 p-2 rounded text-xs">
                {editingCommentId === comment.id ? (
                  // Modo edición
                  <div className="space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      disabled={editLoading}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={editLoading || !editingText.trim()}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {editLoading ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save size={12} />
                            Guardar
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={editLoading}
                        className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 disabled:opacity-50"
                      >
                        <X size={12} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo visualización
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-800">{comment.author}</span>
                        {comment.is_edited && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <CheckCircle size={10} />
                            Editado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 text-xs">{formatDate(comment.created_at)}</span>
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                          title="Editar comentario"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-blue-900">{comment.text}</p>
                    {comment.is_edited && comment.updated_by && (
                      <div className="mt-1 text-xs text-gray-500">
                        Última edición por {comment.updated_by} el {formatDate(comment.updated_at || '')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={handleAddComment} className="border-t border-gray-200 pt-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Agregar Comentario</h4>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          className="w-full p-2 border border-gray-300 rounded text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Agregar'}
        </button>
      </form>
    </div>
  );
} 