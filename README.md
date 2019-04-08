# theoTwitterBot
a theo twitter bot



Create Database:

aws dynamodb create-table --table-name theotwitterbot \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --region eu-west-1 \
  --query TableDescription.TableArn --output text