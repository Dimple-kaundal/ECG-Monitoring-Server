
const fs=require('fs')



// fs.readFile('file.txt', 'utf8',(err, data)=>{// 
//     console.log(err, data)
// })

// const a= fs.readFileSync('file.txt')
// console.log(a.toString())
// console.log('finish reading file')


fs.writeFileSync('file2.txt',"this is my second file ",()=>{
console.log("write")
});
console.log("written to the file")

// when we run this code frst finish reading file will print bzc this call back funcs callss when the file content is finish reading
// node js work on a NON Blocking IO Concpt
// if we want node js to intentially block threads then we use sync fun