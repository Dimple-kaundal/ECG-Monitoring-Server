const express = require('express')
const app= express()
port=3000

app.get('/', (req, res)=>{
    res.send('hello woaaarld')
})
app.get('/about', (req, res)=>{
    res.send("This is An About Page")
})
app.listen(port,()=>{
    console.log(`Example app listening at http://localhost:${port}`)
})