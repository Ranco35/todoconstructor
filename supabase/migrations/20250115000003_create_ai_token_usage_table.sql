-- Migration para crear tabla de seguimiento de tokens de ChatGPT
-- Fecha: 2025-01-15
-- Descripción: Tabla para rastrear uso y gastos aproximados de tokens de OpenAI

-- Crear tabla para almacenar el historial de uso de tokens
CREATE TABLE IF NOT EXISTS ai_token_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  feature_type TEXT NOT NULL, -- 'chat', 'analysis', 'summarization', 'translation', 'code_assistance'
  model_used TEXT NOT NULL, -- 'gpt-3.5-turbo', 'gpt-4', etc.
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6) DEFAULT 0.00,
  request_type TEXT, -- 'completion', 'chat', 'edit', etc.
  endpoint_used TEXT, -- '/api/ai/chat', '/api/ai/analyze', etc.
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar consultas por fecha y usuario
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_id ON ai_token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_created_at ON ai_token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_feature_type ON ai_token_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_model_used ON ai_token_usage(model_used);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_success ON ai_token_usage(success);

-- Crear un índice compuesto para consultas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_date ON ai_token_usage(user_id, created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_ai_token_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_ai_token_usage_updated_at
  BEFORE UPDATE ON ai_token_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_token_usage_updated_at();

-- Insertar algunos datos de ejemplo para testing (opcional)
INSERT INTO ai_token_usage (
  user_id, 
  session_id, 
  feature_type, 
  model_used, 
  prompt_tokens, 
  completion_tokens, 
  total_tokens, 
  estimated_cost_usd,
  request_type,
  endpoint_used
) VALUES 
(1, 'session_001', 'chat', 'gpt-3.5-turbo', 150, 200, 350, 0.000700, 'completion', '/api/ai/chat'),
(1, 'session_002', 'analysis', 'gpt-4', 300, 150, 450, 0.013500, 'completion', '/api/ai/analyze'),
(1, 'session_003', 'summarization', 'gpt-3.5-turbo', 500, 100, 600, 0.001200, 'completion', '/api/ai/summarize'),
(1, 'session_004', 'translation', 'gpt-3.5-turbo', 200, 180, 380, 0.000760, 'completion', '/api/ai/translate'),
(1, 'session_005', 'chat', 'gpt-4', 400, 300, 700, 0.021000, 'completion', '/api/ai/chat');

-- Comentarios sobre la tabla
COMMENT ON TABLE ai_token_usage IS 'Tabla para almacenar el historial de uso de tokens de ChatGPT/OpenAI';
COMMENT ON COLUMN ai_token_usage.user_id IS 'ID del usuario que realizó la consulta';
COMMENT ON COLUMN ai_token_usage.session_id IS 'ID de sesión para agrupar consultas relacionadas';
COMMENT ON COLUMN ai_token_usage.feature_type IS 'Tipo de función: chat, analysis, summarization, translation, code_assistance';
COMMENT ON COLUMN ai_token_usage.model_used IS 'Modelo de OpenAI utilizado (gpt-3.5-turbo, gpt-4, etc.)';
COMMENT ON COLUMN ai_token_usage.prompt_tokens IS 'Número de tokens en el prompt/entrada';
COMMENT ON COLUMN ai_token_usage.completion_tokens IS 'Número de tokens en la respuesta';
COMMENT ON COLUMN ai_token_usage.total_tokens IS 'Total de tokens usados (prompt + completion)';
COMMENT ON COLUMN ai_token_usage.estimated_cost_usd IS 'Costo estimado en USD basado en precios de OpenAI';
COMMENT ON COLUMN ai_token_usage.request_type IS 'Tipo de request realizado a la API';
COMMENT ON COLUMN ai_token_usage.endpoint_used IS 'Endpoint de la API utilizado';
COMMENT ON COLUMN ai_token_usage.success IS 'Si la consulta fue exitosa o falló';
COMMENT ON COLUMN ai_token_usage.error_message IS 'Mensaje de error si la consulta falló'; 