import { hash as _hash } from 'bcryptjs';
_hash('admin123', 10, (err, hash) => {
  if (err) console.error(err);
  console.log(hash); // Use this hash in the SQL below
});


export default _hash;