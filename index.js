const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')
const fs = require('fs')
const schemaFile = fs.readFileSync(__dirname.concat('/schema.graphql'), 'utf8')
const typeDefs = gql`${schemaFile}`
require('dotenv').config()
const mongoConnection = require('monk')(process.env.MONGO_URI)
const todos = mongoConnection.get('todos')

const resolvers = {
    Query: { 
        list: async () => await todos.find({}),
    },
    Mutation: {
        create: async (parent, args) => {
            let { title } = args
            let createdDate = Math.round((new Date()).getTime() / 1000)
            let todo = { title, createdDate, isDone: false }
            todo = await todos.insert(todo)
            return todo
        },

        markDone: async (parent, args) => {
            let { id } = args
            let todo = await todos.findOneAndUpdate({ _id: id }, { $set: { isDone: true } })
            return todo.isDone;
        }
    },
};

const app = express()
const server = new ApolloServer({ typeDefs, resolvers, playground: true });
server.applyMiddleware({ app });
app.listen({ port: process.env.PORT }, () =>
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
);