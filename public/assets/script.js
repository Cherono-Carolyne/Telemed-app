document.addEventListener("DOMContentLoaded", function () {
  const register = document.getElementById("register");
  const first_name = document.querySelector('input[name="first_name"]');
  const last_name = document.querySelector('input[name="last_name"]');
  const email = document.querySelector('input[name="email"]');
  const password = document.querySelector('input[name="password"]');
  const confirm_password = document.querySelector(
    'input[name="confirm_password"]'
  );
  const gender_male = document.querySelector('input[id="male"]');
  const address = document.querySelector('input[name="address"]');
  const phone = document.querySelector('input[name="phone"]');
  const gender_female = document.querySelector('input[id="female"]');
  const dateOfBirth = document.querySelector('input[name="date_of_birth"]');
  const user_type = document.querySelector('select[name="user_type"]');
  const formData = document.querySelector(".form-data");

  let form = {};

  register.addEventListener("click", async function (event) {
    let errorsCount = 0;

    if (first_name.value === "") {
      document.getElementById("error_first_name").innerText =
        "First name is required";
      errorsCount += 1;
    } else {
      document.querySelector("#error_first_name").innerText = "";
    }

    if (last_name.value === "") {
      document.getElementById("error_last_name").innerText =
        "Last name is required";
      errorsCount += 1;
    } else {
      document.querySelector("#error_last_name").innerText = "";
    }

    if (email.value === "") {
      document.getElementById("error_email").innerText = "Email is required";
      errorsCount += 1;
    } else if (!validateEmail(email.value)) {
      document.getElementById("error_email").innerText = "Email is invalid";
      errorsCount += 1;
    } else {
      document.querySelector("#error_email").innerText = "";
    }

    if (password.value === "") {
      document.getElementById("error_password").innerText =
        "Password is required";
      errorsCount += 1;
    } else if (password.value.length < 8) {
      document.getElementById("error_password").innerText =
        "Password should be atleast 8 characters";
      errorsCount += 1;
    } else {
      document.querySelector("#error_password").innerText = "";
    }

    if (confirm_password.value === "") {
      document.getElementById("error_confirm_password").innerText =
        "Confirm password is required";
      errorsCount += 1;
    } else if (
      confirm_password.value !== "" &&
      password.value !== confirm_password.value
    ) {
      document.getElementById("error_confirm_password").innerText =
        "Passwords do not match";
      errorsCount += 1;
    } else {
      document.querySelector("#error_confirm_password").innerText = "";
    }

    if (!gender_male.checked && !gender_female.checked) {
      document.getElementById("error_gender").innerText = "Gender is required";
      errorsCount += 1;
    } else {
      document.querySelector("#error_gender").innerText = "";
    }

    if (errorsCount === 0) {
      form = {
        first_name: first_name.value,
        last_name: last_name.value,
        email: email.value,
        password: password.value,
        confirm_password: confirm_password.value,
        gender: gender_female.checked ? gender_female.value : gender_male.value,
      };

      // name.value = ""
      // email.value = ""
      // password.value = ""
      // confirm_password.value = ""
      // age.value = ""
      // country.value = ""
      // terms.checked = false
      // gender_male.checked = false
      // gender_female.checked = false
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: first_name.value,
          last_name: last_name.value,
          phone: phone.value,
          address: address.value,
          gender: gender_female.checked
            ? gender_female.value
            : gender_male.value,
          email: email.value,
          password: password.value,
          user_type: user_type.value,
          date_of_birth: dateOfBirth.value,
        }),
      });

      const data = await response.json();

      alert(data.message);
    }
  });

  first_name.addEventListener("input", function (event) {
    if (first_name.value === "") {
      document.getElementById("error_first_name").innerText =
        "First is required";
    } else {
      document.querySelector("#error_first_name").innerText = "";
    }
  });

  last_name.addEventListener("input", function (event) {
    if (last_name.value === "") {
      document.getElementById("error_last_name").innerText = "Last is required";
    } else {
      document.querySelector("#error_last_name").innerText = "";
    }
  });

  email.addEventListener("input", function (event) {
    if (email.value === "") {
      document.getElementById("error_email").innerText = "Email is required";
    } else if (!validateEmail(email.value)) {
      document.getElementById("error_email").innerText = "Email is invalid";
    } else {
      document.querySelector("#error_email").innerText = "";
    }
  });
});

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateNumber(number) {
  const regex = /^\d+$/;
  return regex.test(number);
}