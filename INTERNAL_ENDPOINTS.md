# Internal Endpoints

These endpoints are used by the internal team to manage the Topic approval workflow. They are protected by Admin authentication and must not be exposed to students.

## 1. Approve Topic

Moves a topic from `draft` to `approved` status.

- **Method**: `PATCH`
- **URL**: `/api/v1/internal/topics/:id/approve`
- **Auth**: Bearer token (Admin)
- **Expected Request Body**: None (Empty)
- **Example Response (Success)**:
  ```json
  {
    "status": "success",
    "message": "Topic <topic_id> approved."
  }
  ```
- **Example Response (Error - 400 Bad Request)**:
  ```json
  {
    "detail": "Topic must be in 'draft' status to be approved, or topic does not exist."
  }
  ```

## 2. Publish Topic

Moves a topic from `approved` to `published` status.

- **Method**: `PATCH`
- **URL**: `/api/v1/internal/topics/:id/publish`
- **Auth**: Bearer token (Admin)
- **Expected Request Body**: None (Empty)
- **Example Response (Success)**:
  ```json
  {
    "status": "success",
    "message": "Topic <topic_id> published."
  }
  ```
- **Example Response (Error - 400 Bad Request)**:
  ```json
  {
    "detail": "Topic must be in 'approved' status to be published, or topic does not exist."
  }
  ```
