const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Conexión a Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ESTO ARREGLA EL "NOT FOUND": obliga al servidor a enviar el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para guardar la encuesta
app.post('/api/submit', async (req, res) => {
    const { frecuencia, uso, confianza, preocupacion, impacto, sectores } = req.body;
    const { error } = await supabase.from('respuestas').insert([{ 
        frecuencia, uso, confianza, preocupacion, impacto, sectores 
    }]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

app.listen(PORT, () => console.log(`✓ Servidor activo en puerto ${PORT}`));
