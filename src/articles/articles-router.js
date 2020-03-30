const express = require('express');
const ArticlesService = require('./articles-service');
const xss = require('xss');

const articlesRouter = express.Router();
const jsonParser = express.json();

articlesRouter
  .route('/')
  .get((req, res, next) => {
    ArticlesService.getAllArticles(req.app.get('db'))
      .then(articles => {
        let sanitizedArticles = []
        for(const article of articles) {
          sanitizedTitle = xss(article.title)
          sanitizedContent = xss(article.content)
          sanitizedArticles.push({
            id: article.id,
            style: article.style,
            title: sanitizedTitle,
            content: sanitizedContent
          })
        }
        res.json(sanitizedArticles)
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, content, style } = req.body
    const newArticle = {
      title: xss(title),
      content: xss(content), 
      style: style 
    }

    for (const [key, value] of Object.entries(newArticle)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      }
    }

    ArticlesService.insertArticle(req.app.get('db'), newArticle)
      .then(article => {
        res
          .status(201)
          .location(`/articles/${article.id}`)
          .json(article)
      })
      .catch(next)
  })

  articlesRouter
  .route('/:article_id')
  .get((req, res, next) => {
    ArticlesService.getById(req.app.get('db'), req.params.article_id)
      .then(article => {
        if (!article) {
          return res.status(404).json({
            error: { message: `Article doesn't exist` }
          })
        }
        res.json({
          id: article.id,
          style: article.style,
          title: xss(article.title), // sanitize title
          content: xss(article.content), // sanitize content
          date_published: article.date_published
        })
      })
      .catch(next)
  })

module.exports = articlesRouter