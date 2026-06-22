# CI/CD Setup (GitHub Actions → ECR → ECS)

The pipeline in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on every push to `main` (and can be triggered manually).

## Pipeline stages

1. **Checkout code** — `actions/checkout@v5`
2. **Build Docker image** — `docker build` tagged with commit SHA + `latest`
3. **Push image to Amazon ECR** — `docker push` to your ECR repository
4. **Deploy updated image to ECS** — `aws ecs update-service --force-new-deployment`

## Prerequisites

1. AWS infrastructure already created (`terraform apply`)
2. GitHub repository with this code pushed
3. IAM user or role credentials for GitHub Actions

## GitHub Secrets (required)

The error `Credentials could not be loaded` means these secrets are **not set** in your GitHub repo.

### Step 1 — Create an IAM user in AWS

1. AWS Console → **IAM** → **Users** → **Create user**
2. Attach the policy from [IAM policy](#iam-policy-for-github-actions-user) below
3. Open the user → **Security credentials** → **Create access key** → choose **Third-party service**
4. Copy the **Access key ID** and **Secret access key**

### Step 2 — Add secrets to GitHub

1. Open your repo on GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add **both**:

| Secret name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | IAM access key ID (e.g. `AKIA...`) |
| `AWS_SECRET_ACCESS_KEY` | IAM secret access key |

> Secret names must match **exactly** (case-sensitive).

### Step 3 — Re-run the workflow

**Actions** → **CI/CD Deploy to ECS** → **Re-run all jobs**

Or push a new commit to `main`.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Credentials could not be loaded` | Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets (see above) |
| `Node 20 is being deprecated` | Workflow uses `checkout@v5` and `configure-aws-credentials@v6` (Node 24) |
| ECR push denied | IAM user needs ECR permissions (see policy below) |
| ECS update denied | IAM user needs `ecs:UpdateService` permission |
| `ServiceNotFoundException` | ECS service missing — run `cd terraform && terraform apply` in the same region (`ap-south-1`) |

## Workflow environment variables

Defaults match Terraform (`project_name = todo-app`). Change in `deploy.yml` if you used different names:

| Variable | Default |
|----------|---------|
| `AWS_REGION` | `ap-south-1` |
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
      "Resource": "arn:aws:ecr:ap-south-1:ACCOUNT_ID:repository/todo-app"
    },
    {
      "Sid": "ECSDeploy",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:ListServices",
        "ecs:DescribeClusters",
        "ecs:ListClusters"
      ],
      "Resource": "*"
    }
  ]
}
```

Replace `ACCOUNT_ID` and region if different.

## Provision infrastructure (if ECS service is missing)

If deploy fails with `ServiceNotFoundException` or `ClusterNotFoundException`, create AWS resources first.

**Option A — GitHub Actions (one-time):**

**Actions** → **Provision AWS Infrastructure** → **Run workflow**

> Requires broader IAM permissions for Terraform (EC2, VPC, RDS, ELB, IAM, etc.).

**Option B — Local:**

```bash
cd terraform
terraform init
terraform apply
```

Ensure `aws_region` is `ap-south-1` (matches `deploy.yml`).

Then run **CI/CD Deploy to ECS** again.

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
