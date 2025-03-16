import { compare } from 'bcryptjs';

const hashedPassword = '$2b$10$W3NIJixmpq.6JKXgkjrqZePGUNjPRh2JICbUpOwv8IoQ3JrTF2bdq';  // Your stored hash
const passwordToCheck = 'admin123';  // The password you want to check

compare(passwordToCheck, hashedPassword)
  .then(result => {
    if (result) {
      console.log('Password is correct!');
    } else {
      console.log('Incorrect password');
    }
  })
  .catch(error => {
    console.error('Error comparing passwords', error);
  });
