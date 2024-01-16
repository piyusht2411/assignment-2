import express, { Express, Request, Response , Application, NextFunction} from 'express';
import { v2 as cloudinary } from 'cloudinary'
import { genSaltSync, hashSync,compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { databaseConnection, pool} from '../config/db'
import { RequestHandler } from 'express';

export const uplaodImage = async (req:Request,res: Response)=>{
cloudinary.config({ 
  cloud_name: 'dsdpdgybf', 
  api_key: '679633884992235', 
  api_secret: 'pRjji35n7Uv67O_hF2TH3MGavBo',
  secure: true
});
};
//register user
export const register = async (req:Request,res: Response)=>{
  const data = req.body
  // console.log(data);

  // Validate email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
      res.status(400).send('Invalid email format');
      return;
  }
  // Validate password pattern
  const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordPattern.test(data.password)) {
      res.status(400).send('Invalid password format');
      return;
  }
  const client  = await pool.connect();
  const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [data.username]);
  if (existingUser.rows.length > 0) {
      res.status(400).send('Username already exists');
      return;
  }
  const existingEmail = await client.query('SELECT * FROM users WHERE email = $1', [data.email]);
  if (existingEmail.rows.length > 0) {
      res.status(400).send('Email already exists');
      return;
  }
//   const salt = genSaltSync(10);
// const hashPassword = hashSync(data.password, salt);
  
  const result =  await client.query('INSERT INTO users(username, password, fullname, email) VALUES($1, $2, $3, $4)', [data.username, data.password, data.fullname, data.email])
  res.status(200).send('user_registered');
  
}

//login

export const login:RequestHandler = async(req, res, next) => {
  try{
    const data = req.body ;
    const client  = await pool.connect();

    const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [data.username]);

    // Checking if the email exists in database 
    if(!existingUser){
        return res.status(400).json({ok:false,message:"Invalid Credentials"}) ;
    }
    const tableUser = existingUser.rows[0];

    // comapring password entered with database hashed Password
    // const isPasswordMatch = await compareSync(data.password,tableUser.password) ;
    if(data.password!=tableUser.password){
        return res.status(400).json({ok:false,message:"Invalid Credentials"}); 
    }

    // Generating tokens
    const authToken = jwt.sign({userId : tableUser.user_id},process.env.JWT_SECRET_KEY||" ",{expiresIn : '30m'}) ;
    const refreshToken = jwt.sign({userId : tableUser.user_id},process.env.JWT_REFRESH_SECRET_KEY||" ",{expiresIn : '2h'}) ;

    // Saving tokens in cookies 
    res.cookie('authToken',authToken,({httpOnly : true})) ;
    res.cookie('refreshToken',refreshToken,({httpOnly:true}));
    console.log(tableUser.user_id);

    return res.status(200).json({ok:true,message : "Login Successful",userid:tableUser.user_id});

}
catch(err){
    next(err);
}

};
//logout
export const logout:RequestHandler = (req, res, next) => {
  try{
      res.clearCookie('authToken') ;
      res.clearCookie('refreshToken');
      return res.status(200).json({ok:true,message:"User has been logged out"}) ;
  }
  catch(err){
      next(err) ;
  }
};

//get user's data
export const getuserdata:RequestHandler = async(req:Request, res, next) => {
  try{
    if(req.userId?.toString()!==req.params.userId?.toString()){
    return res.status(403).json({ok:false,message:"You have not access to data"}) ;
  }
  const client  = await pool.connect();
  const data:any = await client.query('SELECT * FROM users WHERE user_id = $1', [req.userId]);
  res.status(200).json({data:data.rows[0]});
  } catch(err:any){
      return res.status(500).json({message : err.message})
    }
  
};


export const userPost:RequestHandler = async(req:Request, res, next) => {
  try {
    //user_id => in which user's post, user has to post
    //content => user's content to post
    const { user_id, content } = req.body;
    const client  = await pool.connect();
    const result = await client.query('INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING *', [user_id, content]);
    res.json(result.rows[0]);
  }
  catch(err:any){
    return res.status(500).json({message : err.message})
   }

};

export const comment:RequestHandler = async(req:Request, res, next) => {
  try {
    const { user_id, post_id, content } = req.body;
    const client  = await pool.connect();
    const result = await client.query('INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *', [user_id, post_id, content]);
    res.json(result.rows[0]);
  }
  catch(err:any){
    return res.status(500).json({message : err.message})
  }


};

