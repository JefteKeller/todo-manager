const express = require('express')
const cors = require('cors')

const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(cors())
app.use(express.json())

const users = []

function checksExistsUserAccount (request, response, next) {
    const { username: requestedUsername } = request.headers

    const requestedUser = users.find(user => user.username === requestedUsername)

    if (!requestedUser) {
        return response.status(404).json({
            error: 'User not found!'
        })
    }
    request.user = requestedUser

    return next()
}

function checksExistsTask (request, response, next) {
    const userTasks = request.user.todos
    const { id: taskId } = request.params

    const requestedTask = userTasks.find(task => task.id === taskId)

    if (!requestedTask) {
        return response.status(404).json({
            error: 'Task not found!'
        })
    }
    request.requestedTask = requestedTask

    return next()
}

app.post('/users', (request, response) => {
    const { name, username } = request.body

    const userAlreadyExists = users.some(user => user.username === username)

    if (userAlreadyExists) {
        return response.status(400).json({
            error: 'User already exists!'
        })
    }
    const newUser = {
        id: uuidv4(),
        name,
        username,
        todos: []
    }
    users.push(newUser)

    return response.status(201).json(newUser)
})

app.get('/todos', checksExistsUserAccount, (request, response) => {
    const userTasks = request.user.todos

    return response.status(200).json(userTasks)
})

app.post('/todos', checksExistsUserAccount, (request, response) => {
    const userTasks = request.user.todos
    const { title, deadline } = request.body

    const newTask = {
        id: uuidv4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date()
    }
    userTasks.push(newTask)

    return response.status(201).json(newTask)
})

app.put('/todos/:id', checksExistsUserAccount, checksExistsTask, (request, response) => {
    const { title, deadline } = request.body
    const { requestedTask } = request

    requestedTask.title = title
    requestedTask.deadline = new Date(deadline)

    return response.status(200).json(requestedTask)
})

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTask, (request, response) => {
    const { requestedTask } = request

    requestedTask.done = true

    return response.status(200).json(requestedTask)
})

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTask, (request, response) => {
    const userTasks = request.user.todos
    const { requestedTask } = request

    const taskIndex = userTasks.indexOf(requestedTask)
    userTasks.splice(taskIndex, 1)

    return response.status(204).send()
})

module.exports = app
