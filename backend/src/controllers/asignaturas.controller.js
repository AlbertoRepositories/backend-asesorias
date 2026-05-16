import Asignatura from '../models/Asignatura.js';

export const crearAsignatura = async (req, res) => {
  try {
    const nuevaAsignatura = new Asignatura(req.body);
    await nuevaAsignatura.save();
    res.status(201).json({ success: true, data: nuevaAsignatura });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAsignaturas = async (req, res) => {
  try {
    const asignaturas = await Asignatura.find();
    res.status(200).json({ success: true, data: asignaturas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
