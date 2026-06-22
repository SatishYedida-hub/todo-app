# CI/CD Setup (GitHub Actions → ECR → ECS)

The pipeline in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on every push to `main` (and can be triggered manually).

## Pipeline stages

1. **Checkout code** — `actions/checkout@v4`
2. **Build Docker image** — `docker build` tagged with commit SHA + `latest`
3. **Push image to Amazon ECR** — `docker push` to your ECR repository
4. **Deploy updated image to ECS** — `aws ecs update-service --force-new-deployment`

## Prerequisites

1. AWS infrastructure already created (`terraform apply`)
2. GitHub repository with this code pushed
3. IAM user or role credentials for GitHub Actions

## GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |

## Workflow environment variables

Defaults match Terraform (`project_name = todo-app`). Change in `deploy.yml` if you used different names:

| Variable | Default |
|----------|---------|
| `AWS_REGION` | `us-east-1` |
| `ECR_REPOSITORY` | `todo-app` |
| `ECS_CLUSTER` | `todo-app-cluster` |
| `ECS_SERVICE` | `todo-app-service` |

## IAM policy for GitHub Actions user

Attach a policy like this to the IAM user whose keys you store in GitHub Secrets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuth",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "ECRPush",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/todo-app"
    },
    {
      "Sid": "ECSDeploy",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    }
  ]
}
```

Replace `ACCOUNT_ID` and region if different.

## Trigger a deploy

**Automatic:** push to `main`

```bash
git add .
git commit -m "your changes"
git push origin main
```

**Manual:** GitHub → **Actions** → **CI/CD Deploy to ECS** → **Run workflow**

## Verify

After the workflow succeeds:

```bash
cd terraform
terraform output health_url
terraform output swagger_url
```

Or open the URLs in your browser.
