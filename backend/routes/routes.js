const {Router} = require ('express')
const controller = require('../controller/controller.js')
const router  = Router()

router.get('/login',controller.login_get)
router.get('/signup',controller.signup_get)
router.post('/login',controller.login_post)
router.post('/signup',controller.signup_post)
router.get('/logout',controller.logout_get)


module.exports = router