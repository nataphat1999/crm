<?php

namespace app\models;

use Yii;
use app\libs\Constant;

class TravelExpense extends \yii\db\ActiveRecord
{
    public static function tableName()
    {
        return '{{%travel_expense}}';
    }

    public function rules()
    {
        return [
            [['code', 'request_date', 'requestor_id', 'employee_id', 'department_id', 'purpose', 'payment_method', 'created_by'], 'required'],
            [['request_date', 'cheque_date', 'created_at', 'updated_at'], 'safe'],
            [['requestor_id', 'employee_id', 'department_id', 'status', 'created_by', 'updated_by'], 'integer'],
            [['purpose', 'remark_long'], 'string'],
            [['total_receipt_amount', 'total_mileage_expense', 'total_other_expense', 'total_grand'], 'number'], 
            [['code', 'remark_short', 'payment_method', 'transfer_account_number', 'transfer_bank_branch', 'cheque_account_number', 'cheque_bank_branch'], 'string', 'max' => 255],
            [['code'], 'unique'],
            [['requestor_id'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['requestor_id' => 'id']],
            [['employee_id'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['employee_id' => 'id']],
            [['department_id'], 'exist', 'skipOnError' => true, 'targetClass' => Department::class, 'targetAttribute' => ['department_id' => 'id']],
            [['created_by'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['created_by' => 'id']],
            [['updated_by'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['updated_by' => 'id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => Yii::t('app', 'ID'),
            'code' => Yii::t('app', 'Code'),
            'request_date' => Yii::t('app', 'Date'),
            'requestor_id' => Yii::t('app', 'Requested By'),
            'employee_id' => Yii::t('app', 'Employee ID'),
            'department_id' => Yii::t('app', 'Department'),
            'purpose' => Yii::t('app', 'Purpose'),
            'remark_short' => Yii::t('app', 'Remark'),
            'payment_method' => Yii::t('app', 'Payment Method'),
            'transfer_account_number' => Yii::t('app', 'Transfer Account Number'),
            'transfer_bank_branch' => Yii::t('app', 'Transfer Bank Branch'),
            'cheque_date' => Yii::t('app', 'Cheque Date'),
            'cheque_account_number' => Yii::t('app', 'Cheque Account Number'),
            'cheque_bank_branch' => Yii::t('app', 'Cheque Bank Branch'),
            
            'total_receipt_amount' => Yii::t('travel_expense', 'Total Receipt Amount'),
            'total_mileage_expense' => Yii::t('travel_expense', 'Total Mileage Expense'),
            'total_other_expense' => Yii::t('travel_expense', 'Total Other Expense'),
            'total_grand' => Yii::t('travel_expense', 'Total Grand'),
            
            'remark_long' => Yii::t('app', 'Remark'),
            'status' => Yii::t('app', 'Status'),
            'created_at' => Yii::t('app', 'Created At'),
            'updated_at' => Yii::t('app', 'Updated At'),
            'created_by' => Yii::t('app', 'Created By'),
            'updated_by' => Yii::t('app', 'Updated By'),
        ];
    }

    public function getRequestor()
    {
        return $this->hasOne(User::class, ['id' => 'requestor_id']);
    }

    public function getEmployee()
    {
        return $this->hasOne(User::class, ['id' => 'employee_id']);
    }

    public function getDepartment()
    {
        return $this->hasOne(Department::class, ['id' => 'department_id']);
    }

    public function getTravelExpenseItems()
    {
        return $this->hasMany(TravelExpenseItem::class, ['travel_expense_id' => 'id']);
    }

    public function getTravelExpenseApprovals()
    {
        return $this->hasMany(TravelExpenseApproval::class, ['travel_expense_id' => 'id']);
    }

    public function getSignatureImg($level)
    {
        $approval = TravelExpenseApproval::findOne([
            'travel_expense_id' => $this->id,
            'level' => $level
        ]);
        
        if ($approval && $approval->expense_approval_path) {
            $imagePath = Yii::getAlias('@webroot/uploads/' . $approval->expense_approval_path);
            if (file_exists($imagePath)) {
                return '<img src="' . $imagePath . '" style="max-width:120px; max-height:50px; object-fit:contain;">';
            }
        }
        return '';
    }
    public function getApprovalName($level)
    {
        $approval = TravelExpenseApproval::findOne([
            'travel_expense_id' => $this->id,
            'level' => $level
        ]);
        
        return $approval && $approval->approver ? $approval->approver->fullName : '';
    }
    
    public function getApprovalDate($level)
    {
        $approval = TravelExpenseApproval::findOne([
            'travel_expense_id' => $this->id,
            'level' => $level
        ]);
        
        return $approval && $approval->approved_at ? date('d/M/Y', strtotime($approval->approved_at)) : '';
    }
}