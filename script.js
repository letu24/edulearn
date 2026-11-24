
"use strict";

/* =================================
   1. HELPER FUNCTION
================================= */

function showMessage(element, message, color) {
    if (!element) return;

    element.textContent = message;
    element.style.color = color || "#333";
}


/* =================================
   2. CONTACT FORM
================================= */

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const name = document.getElementById("contactName").value.trim();
        const email = document.getElementById("contactEmail").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();

        const formMessage = document.getElementById("formMessage");

        if (!name || !email || !subject || !message) {
            showMessage(formMessage, "Please fill in all fields.", "red");
            return;
        }

        showMessage(
            formMessage,
            "Thank you, " + name + "! Your message was received.",
            "green"
        );

        contactForm.reset();

    });
}

const courseLinks = {
    HTML: "https://www.w3schools.com/html/",
    CSS: "https://www.w3schools.com/css/",
    JavaScript: "https://www.w3schools.com/js/",
    Java: "https://www.w3schools.com/java/",
    "C++": "https://www.w3schools.com/cpp/",
    Database: "https://www.w3schools.com/sql/"
};

document.querySelectorAll(".course-card").forEach(card => {
    const courseName = card.querySelector("h3").textContent;
    const startButton = card.querySelector(".course-btn");

    startButton.addEventListener("click", () => {
        window.open(courseLinks[courseName], "_blank");
    });
});


/* =================================
   3. ACCOUNT ELEMENTS
================================= */

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const dashboard = document.getElementById("studentDashboard");

const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");

const usersKey = "edulearnUsers";
const activeEmailKey = "edulearnActiveEmail";


/* =================================
   4. GET REGISTERED USERS
================================= */

function getUsers() {

    try {
        return JSON.parse(localStorage.getItem(usersKey) || "[]");
    } catch (error) {
        return [];
    }

}


/* =================================
   5. PASSWORD HASHING
================================= */

function toBase64(bytes) {

    return btoa(String.fromCharCode(...new Uint8Array(bytes)));

}


async function hashPassword(password, salt) {

    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false, 
        ["deriveBits"]
    );

    return await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 120000,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );

}


function hasSecureCrypto() {

    return Boolean(
        window.crypto &&
        window.crypto.subtle &&
        window.crypto.getRandomValues
    );

}


/* =================================
   6. SWITCH BETWEEN FORMS
================================= */

function showRegisterForm() {

    dashboard.hidden = true;
    loginForm.hidden = true;
    registerForm.hidden = false;

    showMessage(loginMessage, "", "");

}


function showLoginForm() {

    dashboard.hidden = true;
    registerForm.hidden = true;
    loginForm.hidden = false;

    showMessage(registerMessage, "", "");

}


document.getElementById("showLogin").addEventListener(
    "click",
    showLoginForm
);


document.getElementById("showRegister").addEventListener(
    "click",
    showRegisterForm
);


/* =================================
   7. STUDENT REGISTRATION
================================= */

registerForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!hasSecureCrypto()) {

        showMessage(
            registerMessage,
            "Please open this website using VS Code Live Server.",
            "red"
        );

        return;
    }

    const name = document.getElementById("regName").value.trim();

    const email = document.getElementById("regEmail")
        .value.trim().toLowerCase();

    const password = document.getElementById("regPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    if (password.length < 8) {

        showMessage(
            registerMessage,
            "Password must contain at least 8 characters.",
            "red"
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            registerMessage,
            "Passwords do not match.",
            "red"
        );

        return;
    }


    const users = getUsers();

    const existingUser = users.find(function(user) {

        return user.email === email;

    });


    if (existingUser) {

        showMessage(
            registerMessage,
            "This email is already registered.",
            "red"
        );

        return;
    }


    try {

        const salt = crypto.getRandomValues(new Uint8Array(16));

        const hash = await hashPassword(password, salt);

        const newUser = {

            name: name,
            email: email,
            salt: toBase64(salt),
            passwordHash: toBase64(hash)

        };


        users.push(newUser);

        localStorage.setItem(
            usersKey,
            JSON.stringify(users)
        );


        showMessage(
            registerMessage,
            "Registration successful! Please login.",
            "green"
        );

        registerForm.reset();

        registerForm.hidden = true;
        loginForm.hidden = false;

        document.getElementById("loginEmail").value = email;

    } catch (error) {

        showMessage(
            registerMessage,
            "Registration failed. Please try again.",
            "red"
        );

    }

});


/* =================================
   8. STUDENT LOGIN
================================= */

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!hasSecureCrypto()) {

        showMessage(
            loginMessage,
            "Please open this website using VS Code Live Server.",
            "red"
        );

        return;
    }


    const email = document.getElementById("loginEmail")
        .value.trim().toLowerCase();

    const password = document.getElementById("loginPassword").value;


    const users = getUsers();

    const user = users.find(function(item) {

        return item.email === email;

    });


    if (!user) {

        showMessage(
            loginMessage,
            "Account not found. Please register.",
            "red"
        );

        return;
    }


    try {

        const saltBytes = Uint8Array.from(
            atob(user.salt),
            character => character.charCodeAt(0)
        );


        const enteredHash = await hashPassword(password, saltBytes);

        const enteredHashText = toBase64(enteredHash);


        if (enteredHashText !== user.passwordHash) {

            showMessage(
                loginMessage,
                "Incorrect password.",
                "red"
            );

            return;
        }


        sessionStorage.setItem(activeEmailKey, email);

        loginForm.reset();

        showDashboard(user);

    } catch (error) {

        showMessage(
            loginMessage,
            "Login failed. Please try again.",
            "red"
        );

    }

});


/* =================================
   9. GET ENROLLED COURSES
================================= */

function getEnrolledCourses(email) {

    try {

        return JSON.parse(
            localStorage.getItem("enrolled_" + email) || "[]"
        );

    } catch (error) {

        return [];

    }

}


/* =================================
   10. SHOW STUDENT DASHBOARD
================================= */

function showDashboard(user) {

    if (!user) return;

    registerForm.hidden = true;
    loginForm.hidden = true;
    dashboard.hidden = false;


    document.getElementById("studentWelcome").textContent =
        "Welcome, " + user.name + "!";


    document.getElementById("profileName").textContent =
        user.name;

    document.getElementById("profileEmail").textContent =
        user.email;


    const availableCourses = [
        "HTML",
        "CSS",
        "JavaScript",
        "Java",
        "C++",
        "Database"
    ];


    const enrolled = getEnrolledCourses(user.email);


    const completed = enrolled.filter(function(course) {

        return course.completed === true;

    });


    document.getElementById("totalCourses").textContent =
        availableCourses.length;

    document.getElementById("enrolledCourses").textContent =
        enrolled.length;

    document.getElementById("completedCourses").textContent =
        completed.length;


    const myCourses = document.getElementById("myCourses");

    myCourses.innerHTML = "";


    if (enrolled.length === 0) {

        myCourses.textContent =
            "You have not enrolled in any courses yet.";

    } else {

        enrolled.forEach(function(course) {

            const card = document.createElement("div");

            card.className = "my-course-card";


            const title = document.createElement("h4");

            title.textContent = course.name;


            const status = document.createElement("p");

            status.textContent = course.completed
                ? "Status: Completed"
                : "Status: In Progress";


            const button = document.createElement("button");

            button.type = "button";

            button.className = "complete-course-btn";


            if (course.completed) {

                button.textContent = "Completed ✓";

                button.disabled = true;

            } else {

                button.textContent = "Mark as Completed";

                button.addEventListener("click", function() {

                    markCourseCompleted(course.name, user);

                });

            }


            card.appendChild(title);
            card.appendChild(status);
            card.appendChild(button);

            myCourses.appendChild(card);

        });

    }


    updateEnrollmentButtons();

}


/* =================================
   11. COURSE ENROLLMENT
================================= */

const courseContainer =
    document.querySelector(".course-container");

const enrollMessage =
    document.getElementById("enrollMessage");


courseContainer.addEventListener("click", function(event) {

    const button = event.target.closest(".enroll-btn");

    if (!button || button.disabled) return;


    const activeEmail = sessionStorage.getItem(activeEmailKey);


    if (!activeEmail) {

        showMessage(
            enrollMessage,
            "Please register or login before enrolling.",
            "red"
        );

        document.getElementById("account").scrollIntoView({
            behavior: "smooth"
        });

        return;
    }


    const courseName = button.dataset.course;

    const enrolled = getEnrolledCourses(activeEmail);


    const alreadyEnrolled = enrolled.some(function(course) {

        return course.name === courseName;

    });


    if (alreadyEnrolled) {

        showMessage(
            enrollMessage,
            "You are already enrolled in this course.",
            "orange"
        );

        return;
    }


    enrolled.push({

        name: courseName,
        completed: false

    });


    localStorage.setItem(
        "enrolled_" + activeEmail,
        JSON.stringify(enrolled)
    );


    showMessage(
        enrollMessage,
        "Successfully enrolled in " + courseName + "!",
        "green"
    );


    const users = getUsers();

    const currentUser = users.find(function(user) {

        return user.email === activeEmail;

    });


    if (currentUser) {

        showDashboard(currentUser);

    }

});


/* =================================
   12. UPDATE ENROLLMENT BUTTONS
================================= */

function updateEnrollmentButtons() {

    const activeEmail = sessionStorage.getItem(activeEmailKey);

    const enrolled = activeEmail
        ? getEnrolledCourses(activeEmail)
        : [];


    const buttons = document.querySelectorAll(".enroll-btn");


    buttons.forEach(function(button) {

        const courseName = button.dataset.course;


        const alreadyEnrolled = enrolled.some(function(course) {

            return course.name === courseName;

        });


        if (alreadyEnrolled) {

            button.textContent = "Enrolled ✓";

            button.disabled = true;

        } else {

            button.textContent = "Enroll Now";

            button.disabled = false;

        }

    });

}


/* =================================
   13. MARK COURSE COMPLETED
================================= */

function markCourseCompleted(courseName, user) {

    const enrolled = getEnrolledCourses(user.email);


    const course = enrolled.find(function(item) {

        return item.name === courseName;

    });


    if (!course) return;


    course.completed = true;


    localStorage.setItem(
        "enrolled_" + user.email,
        JSON.stringify(enrolled)
    );


    showDashboard(user);

}


/* =================================
   14. LOGOUT
================================= */

const logoutBtn = document.getElementById("logoutBtn");


logoutBtn.addEventListener("click", function() {

    sessionStorage.removeItem(activeEmailKey);

    dashboard.hidden = true;

    showLoginForm();

    showMessage(
        loginMessage,
        "You have logged out successfully.",
        "green"
    );

    updateEnrollmentButtons();

    document.getElementById("account").scrollIntoView({
        behavior: "smooth"
    });

});


/* =================================
   15. COURSE SEARCH AND FILTER
================================= */

const courseSearch = document.getElementById("courseSearch");

const courseFilter = document.getElementById("courseFilter");

const noCoursesMessage =
    document.getElementById("noCoursesMessage");


const courseCards = document.querySelectorAll(
    ".course-container .course-card"
);


function filterCourses() {

    const searchText = courseSearch.value
        .trim()
        .toLowerCase();

    const selectedCategory = courseFilter.value;

    let visibleCourses = 0;


    courseCards.forEach(function(card) {

        const courseName = card.querySelector("h3")
            .textContent.toLowerCase();

        const description = card.querySelector("p")
            .textContent.toLowerCase();

        const category = card.dataset.category;


        const matchesSearch =
            courseName.includes(searchText) ||
            description.includes(searchText);


        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;


        if (matchesSearch && matchesCategory) {

            card.hidden = false;

            visibleCourses++;

        } else {

            card.hidden = true;

        }

    });


    noCoursesMessage.hidden = visibleCourses !== 0;

}


courseSearch.addEventListener("input", filterCourses);

courseFilter.addEventListener("change", filterCourses);


/* =================================
   16. MOBILE NAVIGATION
================================= */

const menuToggle = document.getElementById("menuToggle");

const navLinks = document.getElementById("navLinks");


menuToggle.addEventListener("click", function() {

    navLinks.classList.toggle("open");

});


navLinks.querySelectorAll("a").forEach(function(link) {

    link.addEventListener("click", function() {

        navLinks.classList.remove("open");

    });

});



/* =================================
   17. RESTORE LOGIN AFTER REFRESH
================================= */

const savedEmail = sessionStorage.getItem(activeEmailKey);


if (savedEmail) {

    const savedUser = getUsers().find(function(user) {

        return user.email === savedEmail;

    });


    if (savedUser) {

        showDashboard(savedUser);

    } else {

        sessionStorage.removeItem(activeEmailKey);

        updateEnrollmentButtons();

    }

} else {

    updateEnrollmentButtons();

}


/* =================================
   18. FOOTER YEAR
================================= */

document.getElementById("currentYear").textContent =
    new Date().getFullYear();
