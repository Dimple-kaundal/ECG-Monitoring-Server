const http= require('http');
const port= process.env.Port || 3001;
const server=http.createServer((req , res)=>{
    res.statusCode=200;
    console.log(req.url)
    res.setHeader('Content-Type', 'text/html')
    res.end('<h1> Hello World </h> ')


})
server.listen(port,()=>{
    console.log(`Server is listening on port ${port}`);

})