import bcrypt from 'bcrypt';
export const encryptPassword = async (password) => {
    const encryptedPassword = await bcrypt.hash(password, 8);
    return encryptedPassword;
};
export const isPasswordMatch = async (password, userPassword) => {
    return await bcrypt.compare(password, userPassword);
};
