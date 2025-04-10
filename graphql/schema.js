const { buildSchema } = require('graphql');

module.exports = buildSchema (`
    type Post {
        _id : ID!
        title : String!
        content : String!
        imageUrl : String!
        creator : User!
        createdAt : String!
        updatedAt : String!
    }
    
    type User {
        _id : ID!
        email : String!
        name : String!
        password : String
        status : String!
        posts : [Post!]!
    }
    
    type AuthData {
        token : String!
        userId : String!
    }

    type PostData {
        posts : [Post!]!
        totalPosts : Int!
    }
    
    input userInputData {
        email : String!
        password : String!
        name : String!
    }
    
    input postInputData {
        title : String!
        content : String!
        imageUrl : String!
    }

    type RootQuery {
        login(email : String! , password : String!) : AuthData!
        posts : PostData!
    }

    type RootMutation {
        createUser(userInput : userInputData) : User!
        createPost(postInput : postInputData) : Post!
    }

    schema {
        query : RootQuery
        mutation : RootMutation
    }
`);