# Bulk Import API Documentation

## ✅ Implemented Endpoints

Three new bulk import endpoints have been added:

```
POST /api/sales/import/
POST /api/income/import/
POST /api/expenses/import/
```

## 📋 File Format Requirements

### Sales Import (CSV/Excel)
Required columns:
- `invoice_number` - Unique invoice identifier
- `sale_date` - Date of sale (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
- `product_name` - Product name (auto-creates if new)
- `quantity` - Number of items sold
- `unit_price` - Price per unit

Example CSV:
```csv
invoice_number,sale_date,product_name,quantity,unit_price
INV001,2024-01-15,Laptop,2,50000
INV001,2024-01-15,Mouse,2,500
INV002,2024-01-16,Keyboard,5,1500
```

### Income Import (CSV/Excel)
Required columns:
- `category` - Income category name (auto-creates if new)
- `amount` - Income amount
- `income_date` - Date of income (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)

Optional columns:
- `description` - Additional details

Example CSV:
```csv
category,amount,income_date,description
Sales Revenue,150000,2024-01-15,January sales
Consulting,50000,2024-01-20,Client ABC project
```

### Expenses Import (CSV/Excel)
Required columns:
- `category` - Expense category name (auto-creates if new)
- `amount` - Expense amount
- `expense_date` - Date of expense (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)

Optional columns:
- `description` - Additional details

Example CSV:
```csv
category,amount,expense_date,description
Rent,25000,2024-01-01,Office rent January
Utilities,5000,2024-01-05,Electricity bill
Salaries,80000,2024-01-31,Staff salaries
```

## 🚀 How to Use

### Using Postman

#### 1. Login to get JWT token
```
POST http://127.0.0.1:8000/api/login/
Body (JSON):
{
  "username": "your_username",
  "password": "your_password"
}
```
Copy the `access` token from response.

#### 2. Import Sales Data
```
POST http://127.0.0.1:8000/api/sales/import/
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
Body (form-data):
  file: [Select your sales.csv or sales.xlsx]
  branch_id: your-branch-uuid
```

#### 3. Import Income Data
```
POST http://127.0.0.1:8000/api/income/import/
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
Body (form-data):
  file: [Select your income.csv or income.xlsx]
  branch_id: your-branch-uuid
```

#### 4. Import Expenses Data
```
POST http://127.0.0.1:8000/api/expenses/import/
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
Body (form-data):
  file: [Select your expenses.csv or expenses.xlsx]
  branch_id: your-branch-uuid
```

### Using Python Requests

```python
import requests

# Login
login_response = requests.post(
    'http://127.0.0.1:8000/api/login/',
    json={'username': 'your_username', 'password': 'your_password'}
)
token = login_response.json()['access']

# Import Sales
with open('sales.csv', 'rb') as f:
    response = requests.post(
        'http://127.0.0.1:8000/api/sales/import/',
        headers={'Authorization': f'Bearer {token}'},
        files={'file': f},
        data={'branch_id': 'your-branch-uuid'}
    )
    print(response.json())
```

### Using cURL

```bash
# Get token
TOKEN=$(curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}' \
  | jq -r '.access')

# Import sales
curl -X POST http://127.0.0.1:8000/api/sales/import/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sales.csv" \
  -F "branch_id=your-branch-uuid"
```

## 📊 Response Format

### Success Response
```json
{
  "message": "Sales imported successfully"
}
```

### Error Response
```json
{
  "error": "Sales import failed:\n\nRow 5 → Invalid sale_date\nRow 12 → Quantity is missing"
}
```

## ⚠️ Important Notes

1. **Authentication Required**: All import endpoints require JWT authentication
2. **Branch Ownership**: You can only import to branches you own
3. **Atomic Transactions**: If any row fails, entire import is rolled back
4. **Auto-Creation**: Products and categories are auto-created if they don't exist
5. **File Types**: Supports both CSV (.csv) and Excel (.xlsx) files
6. **Date Format**: Accepts YYYY-MM-DD or YYYY-MM-DD HH:MM:SS

## 🔍 Getting Your Branch ID

```
GET http://127.0.0.1:8000/api/branches/
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

Response will include your branch IDs:
```json
[
  {
    "id": "abc-123-def-456",
    "name": "Main Branch",
    ...
  }
]
```

## 🎯 Use Cases

- **Data Migration**: Import existing business data from Excel/CSV
- **Bulk Entry**: Add hundreds of records at once
- **Integration**: Connect with POS systems or accounting software
- **Backup Restore**: Re-import previously exported data
- **Testing**: Populate database with sample data quickly

## 🐛 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "File and branch_id required" | Missing file or branch_id | Include both in request |
| "Branch not found" | Invalid branch_id or not owned by user | Check branch_id and ownership |
| "Missing required columns" | CSV missing required fields | Add all required columns |
| "Invalid sale_date" | Date format incorrect | Use YYYY-MM-DD format |
| "Quantity is missing" | Empty quantity field | Fill all required fields |

## 📝 Sample Files

Create these sample files to test:

**sales_sample.csv**
```csv
invoice_number,sale_date,product_name,quantity,unit_price
INV001,2024-01-15,Laptop,1,50000
INV001,2024-01-15,Mouse,1,500
```

**income_sample.csv**
```csv
category,amount,income_date,description
Sales Revenue,50500,2024-01-15,January sales
```

**expenses_sample.csv**
```csv
category,amount,expense_date,description
Rent,25000,2024-01-01,Office rent
```

---

**Status**: ✅ Bulk Import APIs are ready to use!
