const process = require('process')
const http  = require('http')


const server = http.createServer(require('./app'))

process.on('uncaughtException', err=> {
    console.log(`UNCAUGHTEXPTION ERROR : ${err}`)
    process.exit(1)
})

const PORT = process.env.PORT || 5000

server.listen(PORT, ()=> console.log(`server is listening to this port ${PORT}`))

process.on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
    server.close((err)=> {
        console.log(err)
        process.exit(err ? 1 : 0)
    })
})
  