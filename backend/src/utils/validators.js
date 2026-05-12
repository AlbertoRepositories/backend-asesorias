// Validar email
export const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

// Validar calificación
export const isValidRating = (rating) => {
  return rating >= 1 && rating <= 5;
};