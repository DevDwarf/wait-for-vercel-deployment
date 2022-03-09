const axios = require('axios')
const core = require('@actions/core')
const github = require('@actions/github')

// Wait method
const wait = time =>
  new Promise(resolve => setTimeout(resolve, time * 1000))

// Setup Axios instance
const axiosInstance = axios.create({
  baseURL: "https://api.vercel.com",
  headers: {
    Authorization: `Bearer ${core.getInput("access-token", {
      required: true
    })}`
  }
})

const awaitVercelDeployment = async () => {
  const sha = github.context.payload.after
  const timeout = +core.getInput("wait-for") * 1000
  const endTime = new Date().getTime() + timeout

  while (new Date().getTime() < endTime) {
    try {
      const response = axiosInstance.get('/v6/deployments', {
        params: {
          "meta-githubCommitSha": sha,
          projectId: core.getInput('project-id', {
            required: true
          })
        }
      })

      if(response?.deployments?.length > 0) {
        return response.deployments[0]
      }
    } catch (e) {
      await wait(2)
    }
  }

  throw new Error(`Timeout reached before deployment for ${sha} was found.`)
}

(async () => {
  try {
    const deployment = await awaitVercelDeployment()

    console.log(deployment)
    core.setOutput("url", deployment.url)
  } catch (err) {
    core.setFailed(err.message)
  }
})()
