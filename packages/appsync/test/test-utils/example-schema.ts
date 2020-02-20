import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'

export const input: DocumentNode = gql`
type Blog @model {
  id: ID!
  name: String!
  posts: [Post] @connection(name: "BlogPosts")
}
type Post @model {
  id: ID!
  title: String!
  blog: Blog @connection(name: "BlogPosts")
  comments: [Comment] @connection(name: "PostComments")
}
type Comment @model {
  id: ID!
  content: String
  post: Post @connection(name: "PostComments")
}
`

export const output: DocumentNode = gql`
"""
The AWSTimestamp scalar type represents the number of seconds that have elapsed
since 1970-01-01T00:00Z. Timestamps are serialized and deserialized as numbers.
Negative values are also accepted and these represent the number of seconds till
1970-01-01T00:00Z.
"""
scalar AWSTimestamp

type Blog {
  id: ID!
  name: String!
  posts(filter: ModelPostFilterInput, sortDirection: ModelSortDirection, limit: Int, nextToken: String): ModelPostConnection
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp!
}

type Post {
  id: ID!
  title: String!
  blog: Blog
  comments(filter: ModelCommentFilterInput, sortDirection: ModelSortDirection, limit: Int, nextToken: String): ModelCommentConnection
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp!
}

type Comment {
  id: ID!
  content: String
  post: Post
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp!
}

enum ModelSortDirection {
  ASC
  DESC
}

type ModelBlogConnection {
  items: [Blog]
  nextToken: String
  startedAt: AWSTimestamp
}

input ModelStringInput {
  ne: String
  eq: String
  le: String
  lt: String
  ge: String
  gt: String
  contains: String
  notContains: String
  between: [String]
  beginsWith: String
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
  size: ModelSizeInput
}

input ModelIDInput {
  ne: ID
  eq: ID
  le: ID
  lt: ID
  ge: ID
  gt: ID
  contains: ID
  notContains: ID
  between: [ID]
  beginsWith: ID
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
  size: ModelSizeInput
}

input ModelIntInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelFloatInput {
  ne: Float
  eq: Float
  le: Float
  lt: Float
  ge: Float
  gt: Float
  between: [Float]
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelBooleanInput {
  ne: Boolean
  eq: Boolean
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelSizeInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
}

input ModelBlogFilterInput {
  id: ModelIDInput
  name: ModelStringInput
  and: [ModelBlogFilterInput]
  or: [ModelBlogFilterInput]
  not: ModelBlogFilterInput
}

type Query {
  syncBlogs(filter: ModelBlogFilterInput, limit: Int, nextToken: String, lastSync: AWSTimestamp): ModelBlogConnection
  getBlog(id: ID!): Blog
  listBlogs(filter: ModelBlogFilterInput, limit: Int, nextToken: String): ModelBlogConnection
  syncPosts(filter: ModelPostFilterInput, limit: Int, nextToken: String, lastSync: AWSTimestamp): ModelPostConnection
  getPost(id: ID!): Post
  listPosts(filter: ModelPostFilterInput, limit: Int, nextToken: String): ModelPostConnection
  syncComments(filter: ModelCommentFilterInput, limit: Int, nextToken: String, lastSync: AWSTimestamp): ModelCommentConnection
  getComment(id: ID!): Comment
  listComments(filter: ModelCommentFilterInput, limit: Int, nextToken: String): ModelCommentConnection
}

input CreateBlogInput {
  id: ID
  name: String!
  _version: Int
}

input UpdateBlogInput {
  id: ID!
  name: String
  _version: Int
}

input DeleteBlogInput {
  id: ID
  _version: Int
}

type Mutation {
  createBlog(input: CreateBlogInput!, condition: ModelBlogConditionInput): Blog
  updateBlog(input: UpdateBlogInput!, condition: ModelBlogConditionInput): Blog
  deleteBlog(input: DeleteBlogInput!, condition: ModelBlogConditionInput): Blog
  createPost(input: CreatePostInput!, condition: ModelPostConditionInput): Post
  updatePost(input: UpdatePostInput!, condition: ModelPostConditionInput): Post
  deletePost(input: DeletePostInput!, condition: ModelPostConditionInput): Post
  createComment(input: CreateCommentInput!, condition: ModelCommentConditionInput): Comment
  updateComment(input: UpdateCommentInput!, condition: ModelCommentConditionInput): Comment
  deleteComment(input: DeleteCommentInput!, condition: ModelCommentConditionInput): Comment
}

input ModelBlogConditionInput {
  name: ModelStringInput
  and: [ModelBlogConditionInput]
  or: [ModelBlogConditionInput]
  not: ModelBlogConditionInput
}

enum ModelAttributeTypes {
  binary
  binarySet
  bool
  list
  map
  number
  numberSet
  string
  stringSet
  _null
}

type Subscription {
  onCreateBlog: Blog @aws_subscribe(mutations: ["createBlog"])
  onUpdateBlog: Blog @aws_subscribe(mutations: ["updateBlog"])
  onDeleteBlog: Blog @aws_subscribe(mutations: ["deleteBlog"])
  onCreatePost: Post @aws_subscribe(mutations: ["createPost"])
  onUpdatePost: Post @aws_subscribe(mutations: ["updatePost"])
  onDeletePost: Post @aws_subscribe(mutations: ["deletePost"])
  onCreateComment: Comment @aws_subscribe(mutations: ["createComment"])
  onUpdateComment: Comment @aws_subscribe(mutations: ["updateComment"])
  onDeleteComment: Comment @aws_subscribe(mutations: ["deleteComment"])
}

input BlogInput {
  id: ID!
  name: String!
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp!
}

type ModelPostConnection {
  items: [Post]
  nextToken: String
  startedAt: AWSTimestamp
}

input ModelPostFilterInput {
  id: ModelIDInput
  title: ModelStringInput
  and: [ModelPostFilterInput]
  or: [ModelPostFilterInput]
  not: ModelPostFilterInput
}

input CreatePostInput {
  id: ID
  title: String!
  blog: BlogInput
  _version: Int
  postBlogId: ID
}

input UpdatePostInput {
  id: ID!
  title: String
  blog: BlogInput
  _version: Int
  postBlogId: ID
}

input DeletePostInput {
  id: ID
  _version: Int
}

input ModelPostConditionInput {
  title: ModelStringInput
  and: [ModelPostConditionInput]
  or: [ModelPostConditionInput]
  not: ModelPostConditionInput
}

input PostInput {
  id: ID!
  title: String!
  blog: BlogInput
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp!
}

type ModelCommentConnection {
  items: [Comment]
  nextToken: String
  startedAt: AWSTimestamp
}

input ModelCommentFilterInput {
  id: ModelIDInput
  content: ModelStringInput
  and: [ModelCommentFilterInput]
  or: [ModelCommentFilterInput]
  not: ModelCommentFilterInput
}

input CreateCommentInput {
  id: ID
  content: String
  post: PostInput
  _version: Int
  commentPostId: ID
}

input UpdateCommentInput {
  id: ID!
  content: String
  post: PostInput
  _version: Int
  commentPostId: ID
}

input DeleteCommentInput {
  id: ID
  _version: Int
}

input ModelCommentConditionInput {
  content: ModelStringInput
  and: [ModelCommentConditionInput]
  or: [ModelCommentConditionInput]
  not: ModelCommentConditionInput
}
`