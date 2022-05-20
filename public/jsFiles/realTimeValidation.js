// console.log("file linked ");
const usernameError = document.querySelector(".usernameError");
const passwordError = document.querySelector("#passwordError");
const username = document.querySelector("#username"); 
const password = document.querySelector("#password"); 
const formSubmitButton = document.querySelector("#formSubmitButton");  
let error1 = true, error2 = true; 

username.addEventListener('keyup', () => {
    const usernameValue = username.value; 
    if(usernameValue.length === 0 || !validUsername(usernameValue)) {
        usernameError.style.display = "block";
        formSubmitButton.disabled = true;
        error1 = true;
    } 
    else {
        error1 = false;
        usernameError.style.display = "none";
        if(!error2) formSubmitButton.disabled = false;
    }
}); 

password.addEventListener('keyup', () => {
    const passwordValue = password.value;  
    if(passwordValue.length === 0 || !validatePassword(passwordValue)) {
        passwordError.style.display = "block";
        formSubmitButton.disabled = true; 
        error2 = true;
    } 
    else {  
        error2 = false;
        passwordError.style.display = "none";
        if(!error1) formSubmitButton.disabled = false;
    }
}); 


function validUsername(username) {
    for(char of username) {
        if((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9')
         || char == '-' || char === '_') {

         }
         else return false; 
    }
    return true; 
} 
function validatePassword(password) {
    if(password.length < 8) return false; 
    let containNumber = false, containLetter = false; 
    for(char of password) {
        if(char >= '0' && char <= '9') containNumber = true;
        if((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) containLetter = true; 
        if(char === ' ') return false;
    }
    if(!containNumber || !containLetter) return false; 
    return true; 
}