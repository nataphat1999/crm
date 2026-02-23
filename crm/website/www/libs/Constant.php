<?php

namespace common\libs;

use Yii;

class Constant
{
    const TYPES_DEALER = ['นิติบุคคล' => 'นิติบุคคล', 'บุคคลธรรมดา' => 'บุคคลธรรมดา'];
    const OFFICE_TYPES = ['สำนักงานใหญ่' => 'สำนักงานใหญ่', 'สาขา' => 'สาขา'];
    const PRODUCT_TYPE_GOVERNMENT_NAME = 'government';
    const PRODUCT_TYPE_PRIVATE_NAME = 'private';
    const ITEMS_PRODUCT_TYPE = [self::PRODUCT_TYPE_GOVERNMENT_NAME => 'Government', self::PRODUCT_TYPE_PRIVATE_NAME => 'Private'];
    
    const STATUS_ACTIVE = 1;
    const STATUS_UN_ACTIVE = 0;
    const STATUS_WAITING = 2;
    const STATUS_DONE = 1;
    const STATUS_CANCEL = 3;
    const STATUS_APPROVED = 4;
    const STATUS_DEFECTIVE = 5;
    const STATUS_LOST = 6;
    const STATUS_REPLACE = 7;
    const STATUS_DRAFT = 99;
    const STATUS_EXPENSE_CREATED = 0;

    const STATUS_PROJECTS = [
        self::STATUS_WAITING => 'Waiting',
        self::STATUS_DONE => 'Done',
        self::STATUS_CANCEL => 'Cancel',
        self::STATUS_DRAFT => 'Draft'
    ];
    const STATUS_INVOICE = [
        self::STATUS_WAITING => 'Waiting',
        self::STATUS_DONE => 'Done',
        self::STATUS_CANCEL => 'Cancel',
        self::STATUS_DRAFT => 'Draft'
    ];
    const STATUS_QUOTATION = [
        self::STATUS_WAITING => 'Waiting',
        self::STATUS_DONE => 'Done',
        self::STATUS_CANCEL => 'Cancel',
        self::STATUS_DRAFT => 'Draft'
    ];

    const STATUS_NAMES = [self::STATUS_ACTIVE => 'Active', self::STATUS_UN_ACTIVE => 'Un Active'];
    const TAX_RATE_TYPE = ['TAX' => 'TAX', 'VAT' => 'VAT'];
    const MY_COMPANY_NAME = 'COCONUT SOLUTIONS CO., LTD.';
    const MY_COMPANY_NAME_TH = 'บริษัท โคโค่นัท โซลูชั่น จำกัด';

    const MY_COMPANY_ADDRESS = 'Tax ID : 0107758000123<br>Address : 123/45 Coconut Tower, 18th Floor, Sukhumvit Rd,<br>Bang Na, Bang Na, Bangkok 10260<br>Tel. 02-555-9876, 081-123-4567';
    const MY_COMPANY_ADDRESS_TH = 'เลขประจำตัวผู้เสียภาษี : 0107758000123<br>ที่อยู่ : 123/45 อาคารโคโค่นัท ทาวเวอร์ ชั้น 18 ถนนสุขุมวิท<br>แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260<br>โทร : 02-555-9876, 081-123-4567';
    
    const MY_COMPANY_ADDRESS2_TH = 'เลขที่ 123/45 อาคารโคโค่นัท ทาวเวอร์ ชั้น 18 ถนนสุขุมวิท แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260 เลขประจำตัวผู้เสียภาษี : 0107758000123';
    const MY_COMPANY_ADDRESS2_EN = '123/45 Coconut Tower, 18th Floor, Sukhumvit Rd, Bang Na, Bang Na, Bangkok 10260 Tax ID : 0107758000123';

    const MY_COMPANY_WEBSITE = 'www.coconut-solutions.io';
    const MY_COMPANY_EMAIL = 'Email : contact@coconut-solutions.io';

    const TYPE_PAYMENTS_TH = ['cash' => 'เงินสด', 'bank_transfer' => 'โอนเงิน', 'cheque_bank' => 'เช็คธนาคาร', 'credit' => 'บัตรเครดิตองค์กร'];
    const TYPE_PAYMENTS_EN = ['cash' => 'Cash', 'bank_transfer' => 'Bank Transfer',  'cheque_bank' => 'Cheque Bank',  'credit' => 'Credit'];
    const TYPE_EXTRA_PAYMENTS_TH = ['petty_cash' => 'เงินสดย่อย', 'cheque_bank' => 'เช็คธนาคาร'];
    const TYPE_REF_PAYMENTS_TH = ['voucher' => 'ใบสำคัญจ่าย', 'receipt' => 'ใบรับเงิน'];

    const STATUS_ASSET = [
        self::STATUS_ACTIVE => 'Active',
        self::STATUS_DEFECTIVE => 'Defective',
        self::STATUS_LOST => 'Lost',
        self::STATUS_REPLACE => 'Replace',
        self::STATUS_UN_ACTIVE => 'Un Active'
    ];

    const STATUS_EXPENSE_DRAFT = self::STATUS_DRAFT;
    const STATUS_EXPENSE_WAITING_MANAGER_RECEIVER = 1;
    const STATUS_EXPENSE_WAITING_CHECKER = 2;
    const STATUS_EXPENSE_WAITING_MANAGER_CHECKER = 3;
    const STATUS_EXPENSE_WAITING_APPROVER = 4;
    const STATUS_EXPENSE_APPROVED = 5;
    const STATUS_EXPENSE_REJECTED = 6;

    const STATUS_EXPENSE = [
        self::STATUS_EXPENSE_CREATED => 'สร้าง',
        self::STATUS_EXPENSE_DRAFT => 'โครงร่าง',
        self::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER => 'รอตรวจสอบ(1)',
        self::STATUS_EXPENSE_WAITING_CHECKER => 'รอตรวจสอบ(2)',
        self::STATUS_EXPENSE_WAITING_MANAGER_CHECKER => 'รอตรวจสอบ(3)',
        self::STATUS_EXPENSE_WAITING_APPROVER => 'รออนุมัติ(4)',
        self::STATUS_EXPENSE_APPROVED => 'อนุมัติแล้ว',
        self::STATUS_EXPENSE_REJECTED => 'ปฏิเสธ'
    ];

    const STATUS_EXPENSE_COLORS = [
        self::STATUS_EXPENSE_DRAFT => 'btn-secondary-soft',
        self::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER => 'btn-warning-soft',
        self::STATUS_EXPENSE_WAITING_CHECKER => 'btn-indigo-soft',
        self::STATUS_EXPENSE_WAITING_MANAGER_CHECKER => 'btn-purple-soft',
        self::STATUS_EXPENSE_WAITING_APPROVER => 'btn-brown-soft',
        self::STATUS_EXPENSE_APPROVED => 'btn-success-soft',
        self::STATUS_EXPENSE_REJECTED => 'btn-danger-soft',
    ];
    
    const CAR_TYPES = [
        'A' => 'รถยนต์ A',
        'B' => 'รถยนต์ไฟฟ้า B',
        'C' => 'รถจักรยานยนต์ C'
    ];

    const LOCATIONS = [
        'Ramkamhaeng' => 'Ramkamhaeng',
        'Thaisri' => 'Thaisri',
        'Makkasan' => 'Makkasan',
        'Bangna' => 'Bangna',
        'Tele' => 'Tele',
        'PS Tower' => 'PS Tower',
        'Cyber World' => 'Cyber World',
        'Other' => 'Other',
        'None' => ''
    ];

    const FIELDS_KEY_SHOW = 'SHOW';
    const SHOW_FIELDS_SETTING = [
        'contact_name' => 'contact_name',
        'contact_phone' => 'contact_phone',
        'contact_email' => 'contact_email',
        'unit' => 'unit'
    ];

    const LEVEL_VALIDATOR = [
        'requester' => 1,
        'manager_dept' => 2,
        'verifier' => 3,
        'manager_verifier' => 4,
        'approver' => 5
    ];

    const DOC_TYPE_REQUEST = 'REQUEST';
    const DOC_TYPE_QUOTATION = 'QUOTATION';
    const DOC_TYPE_INVOICE = 'INVOICE';
    const DOC_TYPE_DELIVERY_BILL = 'DELIVERY-BILL';
    const DOC_TYPE_RECEIVE = 'RECEIVE';
    const DOC_TYPE_PURCHASE_REQUEST = 'PURCHASE-REQUEST';
    const DOC_TYPE_PURCHASE_ORDER = 'PURCHASE-ORDER';
    const DOC_TYPE_EXPENSE_REIMBURSEMENT = 'EXPENSE-REIMBURSEMENT';
    const DOC_TYPE_EXPENSE_RECEIPT = 'EXPENSE-RECEIPT';
    const DOC_TYPE_TRAVEL_EXPENSE = 'TRAVEL-EXPENSE';
    const DOC_TYPE_CASH_ADVANCE = 'CASH-ADVANCE';
    const DOC_TYPE_CLEARING_ADVANCE = 'CLEARING-ADVANCE';

    public static function DOCUMENT_TYPES()
    {
        return [
            self::DOC_TYPE_REQUEST => Yii::t('app', 'Request'),
            self::DOC_TYPE_QUOTATION => Yii::t('app', 'Quotation'),
            self::DOC_TYPE_INVOICE => Yii::t('app', 'Invoice'),
            self::DOC_TYPE_DELIVERY_BILL => Yii::t('app', 'Delivery Bill'),
            self::DOC_TYPE_RECEIVE => Yii::t('app', 'Receive'),
            self::DOC_TYPE_PURCHASE_REQUEST => Yii::t('app', 'Purchase Request'),
            self::DOC_TYPE_PURCHASE_ORDER => Yii::t('app', 'Purchase Order'),
            self::DOC_TYPE_EXPENSE_REIMBURSEMENT => Yii::t('app', 'Expense Reimbursement'),
            self::DOC_TYPE_EXPENSE_RECEIPT => Yii::t('app', 'Expense Receipt'),
            self::DOC_TYPE_TRAVEL_EXPENSE => Yii::t('app', 'Travel Expense Request'),
            self::DOC_TYPE_CASH_ADVANCE => Yii::t('app', 'Cash Advance'),
            self::DOC_TYPE_CLEARING_ADVANCE => Yii::t('app', 'Clearing Advance'),
        ];
    }
}