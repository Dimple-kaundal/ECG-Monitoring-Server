const path=require('path')
const a= path.basename('C:\\temp\\myfile.html');
const a1= path.dirname('C:\\temp\\myfile.html');
     // myfile is the basenam of this whole path
console.log(a1)
console.log(a)
const a3= path.extname(__filename)
console.log(a3)