const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Estas variables las configuramos en Render
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/submit', async (req, res) => {
    const { frecuencia, uso, confianza, preocupacion, impacto, sectores } = req.body;
    const { error } = await supabase.from('respuestas').insert([{ 
        frecuencia, uso, confianza, preocupacion, impacto, sectores 
    }]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

app.get('/api/results', async (req, res) => {
    const { data, error } = await supabase.from('respuestas').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ rows: data });
});

app.listen(PORT, () => console.log(`✓ Servidor activo`));
