const bcdbDriver = require('bigchaindb-driver');
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import cors from 'cors'

console.log(process.env.API_PATH);
export const start = async () => {
  try {
    // Send the transaction off to BigchainDB
    const conn = new bcdbDriver.Connection(process.env.API_PATH, 
      {'app_id': process.env.APP_ID,
       'app_key': process.env.APP_KEY
      });

    const typeDefs = [`
      type Query {
        project(id: String): Project
        projects: [Project]
      }
      type Project {
        id: String
        data: ProjectData
      }
      type ProjectData {
        ns: String
      }

      schema {
        query: Query
      }
    `];

    const resolvers = {
      Query: {
        project: async (root, {id}) => {
          return (
            conn.searchAssets(id)
              .then(project => {
                if(project.length == 1)
                  return project[0];
                return null
              })
          )
        },
        projects: async () => {
          return (
            conn.searchAssets('ipld.ixo.dix.project')
              .then(projects => {
                return projects
              })
          )
        },
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    })

    const app = express()

    app.use(cors())

    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))

    app.use('/graphiql', graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(process.env.PORT, () => {
      console.log(`App Site: ${process.env.URL}:${process.env.PORT}/graphql`)
      console.log(`Interactive Site: ${process.env.URL}:${process.env.PORT}/graphiql`)
    })

  } catch (e) {
    console.log(e)
  }

}
