const myURL = new URL('https://example.org');
myURL.pathname = '/a/b/c';
myURL.search = '?d=e'; // used to send data to server syntax= ?key=value&key2=value2 Filtering, searching, or passing data to a database.Search terms, page numbers, IDs
myURL.hash = '#fgh';
console.log(myURL)
