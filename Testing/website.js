
const http = require('http');
const fs= require('fs');

const port = process.env.Port || 3000;
const server=http.createServer((req, res)=>{
    res.statusCode==200;
    res.setHeader('Content-Type', 'text/html')
    console.log(req.url)
    if(req.url =='/'){
         res.statusCode==200;
        res.end('This is nodejs Tutorial')
    }
    else if (req.url =='/about'){
         res.statusCode==200;
        res.end(" This is About Page")
    }
     else if (req.url =='/nav'){
         res.statusCode==200;
         const data= fs.readFileSync('index.html')

        res.end(data.toString())
    }
    else{
       
        res.statusCode==400;
        res.end("Page not found")
    }

})
server.listen(port,()=>{
    console.log(`server is lestining on port ${port}`)

})