import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import bcrypt from 'bcryptjs';
import generateToken from '../utils/createToken.js';

// CREATE USER
const createUser = asyncHandler(async (request, response) => {

    const { username, password, email } = request.body;

    if (!username || !password || !email) {
        return response.status(400).json({ message: "Inserisci tutti gli input" });
    }

    //EXISTING USER
    const userExist = await User.findOne({ email });
    if (userExist) {
        return response.status(400).json({ message: "L'utente già esiste." });
    }

    //BCRYPT PASSWORD HASHED
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, email, password: hashedPassword });


    //SE IL NUOVO UTENTE VIENE CREATO, SI SALVA E GENERA UN TOKEN DI ACCESSO UTENTE PERSONALE
    try {
        await newUser.save();
        generateToken(response, newUser._id);
        return response.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isAdmin: newUser.isAdmin
        });
    } catch (error) {
        return response.status(400).json({ message: "I dati non sono corretti!" });
    }

});

// LOGIN
const loginUser = asyncHandler(async (request, response) => {

    const { email, password } = request.body; 
    const existingUser = await User.findOne({ email });

    //SE L'UTENTE ESISTE COMPARA LA PASSWORD CON QUELLA USATA DURANTE LA REGISTRAZIONE
    if (existingUser) {
        const isPasswordValid = await bcrypt.compare(password, existingUser.password); 
        //SE è VALIDA RESTITUISCE UN TOKEN DI ACCESSO UTENTE 
        if (isPasswordValid) {
            generateToken(response, existingUser._id);
            return response.status(200).json({
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin
            });
        } else {
            return response.status(401).json({ message: "Credenziali non valide" });
        }
    } else {
        return response.status(401).json({ message: "Credenziali non valide" });
    }
});

//LOGOUT
const logoutCurrentUser = asyncHandler(async (request, response) => {
    //RIMUOVW IL TOKEN SE PRESENTE
    response.cookie("jwt" ,'', {
        httpOnly: true,
        expires: new Date(0),
    })
    response.status(200).json({message: "LOG-OUT EFFETTUATO CON SUCCESSO"})
})

//GET ALL USERS
const getAllUsers = asyncHandler(async(request,response)=>{
    const users = await User.find({})
    response.json(users)
})

const getCurrentlyUserProfile = asyncHandler(async(request,response) =>{
    const user = await User.findById(request.user._id)
    if(user){
            response.json({
                _id: user._id,
                username: user.username,
                email: user.email
            })
    }else{
        response.status(404)
        throw new Error("Utente non trovato!")
    }
})

const updateCurrentlyUserProfile = asyncHandler(async(request,response) => {
    const user = await User.findById(request.user._id)
    if(user){
        user.username = request.body.username || user.username,
        user.email = request.body.email || user.email

        if(request.body.password){
            user.password = request.body.password
        }

        const updateUser = await user.save();

        response.json({
            _id: updateUser._id,
            username: updateUser.username,
            _email: updateUser.email,
            isAdmin: updateUser.isAdmin,
        })
    }else{
        response.status(404)
        throw new Error("Utente non trovato per le modifiche!")
    }
})


//RETURN DI TUTTE LE FUNZIONI DI QUESTO FOGLIO
export { createUser, loginUser, logoutCurrentUser, getAllUsers, getCurrentlyUserProfile, updateCurrentlyUserProfile };
