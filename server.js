const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos online
const supabase = createClient('TU_URL_DE_SUPABASE', 'TU_LLAVE_ANONIMA');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Guardar en la nube
app.post('/api/submit', async (req, res) => {
    const { frecuencia, uso, confianza, preocupacion, impacto, sectores } = req.body;
    
    const { error } = await supabase.from('respuestas').insert([{ 
        frecuencia: frecuencia.join(', '), 
        uso: uso.join(', '),
        confianza: confianza.join(', '),
        preocupacion: preocupacion.join(', '),
        impacto: impacto.join(', '),
        sectores: sectores.join(', ')
    }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

// Leer de la nube
app.get('/api/results', async (req, res) => {
    const { data, error } = await supabase.from('respuestas').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ rows: data });
});

app.listen(PORT, () => console.log(`✓ Servidor online en puerto ${PORT}`));