const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Conexión a Supabase usando variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(__dirname)); // Sirve index.html, survey.js y estilos

// Ruta principal para cargar la página
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 1. RUTA PARA GUARDAR RESPUESTAS ---
app.post('/api/submit', async (req, res) => {
    const { frecuencia, uso, confianza, preocupacion, impacto, sectores } = req.body;
    const { error } = await supabase.from('respuestas').insert([{ 
        frecuencia, uso, confianza, preocupacion, impacto, sectores 
    }]);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

// --- 2. RUTA PARA CARGAR RESULTADOS (La que te faltaba) ---
app.get('/api/results', async (req, res) => {
    try {
        const { data, error } = await supabase.from('respuestas').select('*');
        if (error) throw error;

        // Estructura que espera tu frontend para las gráficas
        const summary = {};
        const questions = ['frecuencia', 'uso', 'confianza', 'preocupacion', 'impacto', 'sectores'];

        // Inicializar el objeto summary
        questions.forEach(q => summary[q] = {});

        // Procesar los datos para contar votos
        data.forEach(row => {
            questions.forEach(q => {
                const val = row[q];
                if (!val) return;
                
                // Convertir a array si es un string (para manejar preguntas multi y single igual)
                const options = Array.isArray(val) ? val : [val];
                options.forEach(opt => {
                    summary[q][opt] = (summary[q][opt] || 0) + 1;
                });
            });
        });

        // Enviar respuesta en JSON puro
        res.json({ summary, rows: data });

    } catch (err) {
        console.error("Error en /api/results:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`✓ Servidor activo en puerto ${PORT}`));
