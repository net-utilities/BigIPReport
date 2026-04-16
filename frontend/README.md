# Frontend

Frontend source and build tooling for BigIPReport.

- Source code lives in `frontend/src`.
- `npm run build` compiles the bundle to `frontend/underlay/js/bigipreport.js`.
- Static assets are served from `frontend/underlay/`.

Build the frontend container from the `frontend/` directory with:

```bash
docker build -t bigipreport/frontend .
```
