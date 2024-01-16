import express, {Router, Express, Request, Response , Application} from 'express';
import {register, login, getuserdata, logout,userPost, comment, uplaodImage} from '../controller/allcontroller';
import { authenticateToken } from '../middleware/authenticateToken';


const router = Router();
router.post('/login', login)
router.post('/register', register);
router.get('/logout', logout);
router.get('/getuserdata/:userId',authenticateToken, getuserdata);
router.post('/comment', comment);
router.post('post', userPost);
router.post('/imageUplaod', uplaodImage);

export default router;