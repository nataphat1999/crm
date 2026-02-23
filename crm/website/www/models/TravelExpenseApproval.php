<?php

namespace app\models;

use Yii;

class TravelExpenseApproval extends \yii\db\ActiveRecord
{
    public static function tableName()
    {
        return '{{%travel_expense_approval}}';
    }

    public function rules()
    {
        return [
            [['travel_expense_id', 'approver_id', 'level'], 'required'],
            [['travel_expense_id', 'approver_id', 'level'], 'integer'],
            [['status', 'remark', 'expense_approval_path'], 'string'],
            [['approved_at'], 'safe'],
            [['approver_id'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['approver_id' => 'id']],
            [['travel_expense_id'], 'exist', 'skipOnError' => true, 'targetClass' => TravelExpense::class, 'targetAttribute' => ['travel_expense_id' => 'id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => Yii::t('app', 'ID'),
            'travel_expense_id' => Yii::t('app', 'Travel Expense ID'),
            'approver_id' => Yii::t('app', 'Approver'),
            'level' => Yii::t('app', 'Level'),
            'status' => Yii::t('app', 'Status'),
            'remark' => Yii::t('app', 'Remark'),
            'approved_at' => Yii::t('app', 'Approved Date'),
            'expense_approval_path' => Yii::t('app', 'Approval Path'),
        ];
    }

    public function getApprover()
    {
        return $this->hasOne(User::class, ['id' => 'approver_id']);
    }

    public function getTravelExpense()
    {
        return $this->hasOne(TravelExpense::class, ['id' => 'travel_expense_id']);
    }
}