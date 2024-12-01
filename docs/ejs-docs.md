# EJS Documentation - A Detailed Guide for Using EJS (Embedded JavaScript)

EJS (Embedded JavaScript) is a templating engine for JavaScript that enables you to embed JavaScript logic directly into your HTML pages. It is typically used to generate dynamic HTML content on the server side in Node.js applications.

This detailed guide will cover the following:

1. **Installation and Setup**
2. **Basic Usage**
3. **Template Syntax**
4. **Data Passing**
5. **EJS Features**
   - Includes (partial views)
   - Conditionals & Loops
   - Template Inheritance
   - Filters
6. **EJS with Express.js**
7. **Advanced EJS Features**
   - Asynchronous Rendering
   - Layouts and Partials
   - Caching
8. **Best Practices**
9. **Troubleshooting and Debugging**

---

### 1. Installation and Setup

To get started with EJS, first, you need to install it via npm. If you're using it with Express.js, you'll also need to set it up as the view engine.

#### Installation via npm:

```bash
npm install ejs
```

#### Basic Express Setup:

1. Create a new directory for your project and navigate into it:

```bash
mkdir my-ejs-app
cd my-ejs-app
```

2. Initialize a new Node.js project and install dependencies:

```bash
npm init -y
npm install express ejs
```

3. Create a basic Express server in `server.js`:

```javascript
const express = require("express");
const app = express();

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Serve static files like images, CSS, and JavaScript
app.use(express.static("public"));

// Basic route
app.get("/", (req, res) => {
  res.render("index", { title: "My EJS App" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

4. Create an `index.ejs` file in the `views` folder:

```
/views
  └── index.ejs
```

5. Render the page from the route:

```html
<!-- /views/index.ejs -->
<!doctype html>
<html>
  <head>
    <title><%= title %></title>
  </head>
  <body>
    <h1>Welcome to <%= title %></h1>
  </body>
</html>
```

Now, when you navigate to `http://localhost:3000`, you will see "Welcome to My EJS App" rendered.

---

### 2. Basic Usage

EJS allows embedding JavaScript logic in your HTML markup using `<%= %>` tags. You can use these to inject dynamic content.

#### Data Injection:

```html
<h1>Hello, <%= username %>!</h1>
```

This will inject the value of the `username` variable into the HTML.

#### Basic Example:

```javascript
app.get("/", (req, res) => {
  res.render("index", { username: "John Doe" });
});
```

Output:

```html
<h1>Hello, John Doe!</h1>
```

---

### 3. Template Syntax

EJS uses various tags for different operations:

#### Output Tags `<%= %>`

This tag outputs the value of a variable into the HTML:

```html
<p><%= message %></p>
```

If `message = "Hello World"`, the output will be:

```html
<p>Hello World</p>
```

#### Escape Output `<%- %>`

This tag outputs the value as raw HTML, without escaping it:

```html
<p><%- htmlContent %></p>
```

If `htmlContent = "<b>Bold text</b>"`, the output will be:

```html
<p><b>Bold text</b></p>
```

#### Logic Tags `<% %>`

These tags are used to write JavaScript code without output:

```html
<% for (let i = 0; i < 5; i++) { %>
<p>Item <%= i %></p>
<% } %>
```

---

### 4. Data Passing

You pass data to an EJS template through the `render()` function. The second argument is an object containing the data you want to pass.

#### Example:

```javascript
app.get("/user", (req, res) => {
  const user = { name: "Alice", age: 25 };
  res.render("user", { user: user });
});
```

#### In the `user.ejs` template:

```html
<h1>Welcome, <%= user.name %></h1>
<p>Age: <%= user.age %></p>
```

---

### 5. EJS Features

#### Includes (Partial Views)

EJS allows you to include other templates inside your current template using the `<%- include('filename') %>` syntax.

##### Example:

```html
<!-- /views/layout.ejs -->
<html>
  <head>
    <title><%= title %></title>
  </head>
  <body>
    <%- include('header') %>
    <div class="content"><%- body %></div>
    <%- include('footer') %>
  </body>
</html>
```

In the `index.ejs`, you can render content in the body:

```html
<% include('layout', { title: 'Home', body: 'Welcome to the homepage' }) %>
```

---

#### Conditionals & Loops

You can use standard JavaScript conditionals and loops in EJS.

##### Example of Conditional Rendering:

```html
<% if (user) { %>
<p>Hello, <%= user.name %></p>
<% } else { %>
<p>Please log in</p>
<% } %>
```

##### Example of Looping:

```html
<ul>
  <% for (let i = 0; i < items.length; i++) { %>
  <li><%= items[i] %></li>
  <% } %>
</ul>
```

---

#### Template Inheritance

You can create reusable layouts with EJS by defining base templates and extending them.

##### Base Template (`layout.ejs`):

```html
<html>
  <head>
    <title><%= title %></title>
  </head>
  <body>
    <header><h1>My Website</h1></header>
    <div class="content"><%- body %></div>
    <footer>© 2024 My Website</footer>
  </body>
</html>
```

##### Child Template (`home.ejs`):

```html
<% layout('layout') %>

<h2>Welcome to the Home Page</h2>
<p>This is a dynamic page with EJS!</p>
```

---

#### Filters

Filters are simple JavaScript functions that you can use to transform values before rendering them.

```html
<%= user.name | capitalize %>
```

You can create custom filters in EJS:

```javascript
ejs.filters.capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
```

---

### 6. EJS with Express.js

EJS is commonly used with Express.js. Here is how to set up an Express app using EJS:

1. Set EJS as the view engine:

```javascript
app.set("view engine", "ejs");
```

2. Create templates inside the `views` directory.
3. Use `res.render('template', data)` to render the view and pass data.

#### Example with Dynamic Routes:

```javascript
app.get("/user/:id", (req, res) => {
  const user = getUserById(req.params.id);
  res.render("user", { user });
});
```

---

### 7. Advanced EJS Features

#### Asynchronous Rendering

EJS supports asynchronous rendering with `async` keyword, useful for operations like database queries.

```javascript
app.get("/async", async (req, res) => {
  const data = await fetchDataFromDB();
  res.render("asyncTemplate", { data });
});
```

#### Caching

EJS supports caching compiled templates for improved performance.

```javascript
app.set("view cache", true);
```

---

### 8. Best Practices

- **Keep logic minimal**: Avoid complex logic inside your templates. Use controllers to manage data manipulation.
- **Use Partials for Reusability**: Break your views into smaller components like headers, footers, and sidebars.
- **Use Layouts**: For better code maintainability, use layouts to wrap around the content.

---

### 9. Troubleshooting and Debugging

- **Syntax Errors**: Ensure that your EJS syntax (`<%= %>`, `<%- %>`, `<% %>`) is properly closed and nested.
- **Missing Variables**: If you encounter issues with missing variables, ensure that the data is passed correctly in `res.render()`.
- **Rendering Issues**: Make sure that the file paths for the templates are correct and that the views directory is properly set in Express.

---
