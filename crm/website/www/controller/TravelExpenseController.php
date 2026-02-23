<?php

namespace app\controllers;

use app\models\TravelExpense;
use app\models\TravelExpenseSearch;
use app\models\TravelExpenseItem;
use app\models\TravelExpenseApproval;
use app\models\User;
use app\models\Project;
use app\models\Department;
use app\models\Position;
use app\libs\Constant;
use Yii;
use yii\web\Controller;
use yii\web\NotFoundHttpException;
use yii\filters\VerbFilter;
use yii\base\Model; 
use yii\helpers\ArrayHelper;
use yii\helpers\FileHelper;
use app\models\SettingValidator;
use app\models\SettingDocument;
use app\components\MyComponent;
use app\components\Forms;
use app\models\ExpenseApproval;

class TravelExpenseController extends Controller
{
    public function behaviors()
    {
        return array_merge(
            parent::behaviors(),
            [
                'verbs' => [
                    'class' => VerbFilter::class,
                    'actions' => [
                        'delete' => ['POST'],
                    ],
                ],
            ]
        );
    }

    public $signatureMap = [
        1 => 'signature_requester',
        2 => 'signature_manager_dept',
        3 => 'signature_verifier',
        4 => 'signature_manager_verifier',
        5 => 'signature_approver',
    ];

    public function actionIndex()
    {
        $setYear = (isset($_GET['selectYear']) && $_GET['selectYear'] != '') ? $_GET['selectYear'] : 'all';
        $searchModel = new \yii\base\DynamicModel(['code' => null, 'status' => null]);
        $searchModel->load(Yii::$app->request->get());
    
        $travelTable = \app\models\TravelExpense::tableName();
        $departmentTable = \app\models\Department::tableName();
        $userTable = \app\models\User::tableName();
        $approvalTable = \app\models\TravelExpenseApproval::tableName();
        
        $employeeTableAlias = 'employee';
        $employeePositionTableAlias = 'employeePosition';
        $employeeDeptTableAlias = 'employeeDepartment';
    
        $STATUS_DRAFT = \app\libs\Constant::STATUS_EXPENSE_DRAFT;
        $STATUS_REJECTED = \app\libs\Constant::STATUS_EXPENSE_REJECTED;
        $STATUS_APPROVED = \app\libs\Constant::STATUS_EXPENSE_APPROVED;
        $STATUS_WAITING_START = \app\libs\Constant::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER;
        $STATUS_WAITING_END = \app\libs\Constant::STATUS_EXPENSE_WAITING_APPROVER;
    
        $currentUser = Yii::$app->user->identity;
        $userId = $currentUser->id;
        $roles = \Yii::$app->authManager->getRolesByUser($userId);
        $roleName = array_key_first($roles);
    
        $query = \app\models\TravelExpense::find()
        ->joinWith('requestor')
        ->leftJoin($departmentTable, $travelTable . '.department_id = ' . $departmentTable . '.id')
        ->leftJoin($userTable . ' AS ' . $employeeTableAlias, $employeeTableAlias . '.id = ' . $travelTable . '.employee_id')
        ->leftJoin(\app\models\Position::tableName() . ' AS ' . $employeePositionTableAlias, $employeePositionTableAlias . '.id = ' . $employeeTableAlias . '.position_id')
        ->leftJoin($departmentTable . ' AS ' . $employeeDeptTableAlias, $employeeDeptTableAlias . '.id = ' . $employeePositionTableAlias . '.department_id')
        ->select([
            $travelTable . '.*',
            $userTable . '.username AS requestor_name',
            $departmentTable . '.name AS department_name',
            $employeeTableAlias . '.first_name AS emp_first_name',
            $employeeTableAlias . '.last_name AS emp_last_name',
            'approved_date_l5' => (new \yii\db\Query())
                ->select(['approved_at'])
                ->from($approvalTable)
                ->where($approvalTable . '.travel_expense_id = ' . $travelTable . '.id')
                ->andWhere(['level' => 5])
                ->limit(1)
        ])
        ->with(['requestor', 'employee', 'travelExpenseApprovals'])
        ->asArray();
    
        $isApproverSubquery = (new \yii\db\Query())
            ->select(new \yii\db\Expression('1'))
            ->from($approvalTable)
            ->where($approvalTable . '.travel_expense_id = ' . $travelTable . '.id')
            ->andWhere([$approvalTable . '.approver_id' => $userId])
            ->andWhere(['between', $approvalTable . '.level', 1, 5]);
    
        if ($roleName === 'Admin_Sys' || $roleName === 'Admin_Office') {
            $query->andWhere([
                'OR',
                ['!=', $travelTable . '.status', $STATUS_DRAFT],
                [$travelTable . '.requestor_id' => $userId]
            ]);
        } else {
            $query->andWhere([
                'OR',
                [$travelTable . '.requestor_id' => $userId],
                [$travelTable . '.employee_id' => $userId],
                [
                    'AND',
                    ['!=', $travelTable . '.status', $STATUS_DRAFT],
                    ['EXISTS', $isApproverSubquery]
                ]
            ]);
        }
    
        if ($setYear != 'all') {
            $query->andWhere('DATE_FORMAT(' . $travelTable . '.request_date, "%Y") = :year', [':year' => $setYear]);
        }
    
        if ($searchModel->code != '') {
            $query->andFilterWhere(['like', 'code', $searchModel->code]);
        }
    
        if ($searchModel->status != '') {
            $query->andFilterWhere(['status' => $searchModel->status]);
        }
    
        $models = $query->orderBy(['created_at' => SORT_DESC])->all();
        foreach ($models as &$model) {
            $status = (int) $model['status'];
            $requestorId = (int) $model['requestor_id'];
            $buttonText = 'รายละเอียด';

            if ($requestorId === $userId && ($status === $STATUS_DRAFT || $status === (int)$STATUS_REJECTED)) {
                $buttonText = 'แก้ไข';
            } 
            elseif ($status >= $STATUS_WAITING_START && $status <= $STATUS_WAITING_END) {
                $isMyTurn = false;
                if (!empty($model['travelExpenseApprovals'])) {
                    $tempApps = $model['travelExpenseApprovals'];
                    usort($tempApps, function($a, $b) {
                        return (int)$a['level'] - (int)$b['level'];
                    });

                    $currentApprover = null;
                    foreach ($tempApps as $app) {
                        if (trim($app['status']) === 'pending') {
                            $currentApprover = $app;
                            break; 
                        }
                    }

                    if ($currentApprover !== null && (int)$currentApprover['approver_id'] === $userId) {
                        $isMyTurn = true;
                    }
                }
                
                if ($isMyTurn) {
                    $buttonText = 'ตรวจสอบ';
                }
            }
            $model['buttonText'] = $buttonText;
        }
        
        $dataProvider = new \yii\data\ArrayDataProvider([
            'allModels' => $models, 
            'pagination' => ['pageSize' => 20],
            'sort' => [
                'attributes' => ['created_at', 'code', 'status', 'requestor_name', 'department_name'], 
                'defaultOrder' => ['created_at' => SORT_DESC]
            ],
        ]);
    
        return $this->render('index', [
            'searchModel' => $searchModel,
            'dataProvider' => $dataProvider,
            'roleName' => $roleName,
        ]);
    }
    
    public function actionView($id)
    {
        return $this->render('view', [
            'model' => $this->findModel($id),
        ]);
    }

    public function actionCreate()
    {
        $model = new TravelExpense();
        $modelsItem = [new TravelExpenseItem()];
        
        if ($model->isNewRecord) {
            $model->code = '-';
            $model->status = \app\libs\Constant::STATUS_EXPENSE_DRAFT;
            if (Yii::$app->user->identity) {
                $model->requestor_id = Yii::$app->user->id;
            }
        }
        
        $modelsApproval = $this->prepareApprovalModels($model);
        if ($model->isNewRecord && isset($modelsApproval[1])) {
            $requestor = User::findOne(Yii::$app->user->id);
            if ($requestor && !empty($requestor->signature_path)) {
                $modelsApproval[1]->expense_approval_path = $requestor->signature_path;
            }
        }
        $usersModel = User::find()->where(['status' => User::STATUS_ACTIVE])->with('position')->all();
        $projectsModel = Project::find()->all();
        $departmentsModel = Department::find()->all();
        $positionsModel = Position::find()->all();
        
        $users = ArrayHelper::map($usersModel, 'id', 'fullName');
        $payees = $users;
        $departments = ArrayHelper::map($departmentsModel, 'id', 'name');
        $positions = ArrayHelper::map($positionsModel, 'id', 'name');
        
        $usersData = ArrayHelper::map($usersModel, 'id', function($user) {
            return [
                'department_id' => $user->position->department_id ?? null,
                'position_id' => $user->position_id,
                'bank_branch' => $user->bank_branch,
                'bank_no' => $user->bank_no,
            ];
        });
        
        $projects = ArrayHelper::map($projectsModel, 'id', function($project) {
            return $project->code . ' ' . $project->name;
        });
        $projectsJson = json_encode(ArrayHelper::map($projectsModel, 'id', function($project) {
            return ['id' => $project->id, 'name' => $project->name, 'code' => $project->code];
        }));
        
        $modelItem = $modelsItem[0];
        
        if (Yii::$app->request->isPost) {
            $postData = Yii::$app->request->post();
            
            if (isset($postData['TravelExpense']['request_date']) && !empty($postData['TravelExpense']['request_date'])) {
                $date = \DateTime::createFromFormat('d/m/Y', $postData['TravelExpense']['request_date']);
                if ($date) { $postData['TravelExpense']['request_date'] = $date->format('Y-m-d'); }
            }
    
            if (isset($postData['TravelExpense']['cheque_date']) && !empty($postData['TravelExpense']['cheque_date'])) {
                $date = \DateTime::createFromFormat('d/m/Y', $postData['TravelExpense']['cheque_date']);
                if ($date) { 
                    $postData['TravelExpense']['cheque_date'] = $date->format('Y-m-d'); 
                }
            }
            
            if (isset($postData['TravelExpense'])) {
                $numericFields = ['sub_total', 'total_vat', 'total_wht', 'total_net', 'total_receipt_amount', 'total_mileage_expense', 'total_other_expense', 'total_grand'];
                foreach ($numericFields as $field) {
                    if (isset($postData['TravelExpense'][$field])) {
                        $postData['TravelExpense'][$field] = str_replace(',', '', $postData['TravelExpense'][$field]);
                    }
                }
            }
            
            $itemKey = 'TravelExpenseItem';
            if (isset($postData[$itemKey]) && is_array($postData[$itemKey])) {
                $itemNumericFields = ['amount', 'distance', 'travel_price', 'other_items_price'];
                foreach ($postData[$itemKey] as $i => $item) {
                    if (isset($item['item_date']) && !empty($item['item_date'])) {
                        $date = \DateTime::createFromFormat('d/m/Y', $item['item_date']);
                        if ($date) { $postData[$itemKey][$i]['item_date'] = $date->format('Y-m-d'); }
                    }
                    foreach ($itemNumericFields as $field) {
                        if (isset($item[$field])) {
                            $postData[$itemKey][$i][$field] = str_replace(',', '', $postData[$itemKey][$i][$field]);
                        }
                    }
                }
            }
            
            $oldModelsItem = $modelsItem;
            $modelsItem = self::createMultiple(TravelExpenseItem::class, $oldModelsItem);
            
            if ($model->load($postData) && Model::loadMultiple($modelsItem, $postData)) {
                
                if ($model->isNewRecord) {
                    $model->created_by = Yii::$app->user->id;
                    $model->department_id = Yii::$app->user->identity->position->department_id ?? null;
                }
    
                $modelsItem = array_filter($modelsItem, function ($m) {
                    return !empty($m->description) || (float)$m->amount > 0;
                });
                $modelsItem = array_values($modelsItem);
                
                $isValid = $model->validate();
                $isValid = Model::validateMultiple($modelsItem) && $isValid;
                
                if ($isValid) {
                    $transaction = Yii::$app->db->beginTransaction();
                    try {
                        $employeeId = $model->employee_id;
                        $employeeDepartmentId = $usersData[$employeeId]['department_id'] ?? null;
    
                        $level2_approverId = $employeeDepartmentId ? Department::find()->where(['id' => $employeeDepartmentId])->select('manager_id')->scalar() : null;
                        $level3_approverId = SettingValidator::find()->where(['doc_type' => 'TRAVEL-EXPENSE', 'level' => 3])->select('employee_id')->scalar();
                        $level4_approverId = SettingValidator::find()->where(['doc_type' => 'TRAVEL-EXPENSE', 'level' => 4])->select('employee_id')->scalar();
                        $level5_approverId = SettingValidator::find()->where(['doc_type' => 'TRAVEL-EXPENSE', 'level' => 5])->select('employee_id')->scalar();
    
                        $missingLevels = [];
                        if (!$level2_approverId) $missingLevels[] = "หัวหน้าแผนก";
                        if (!$level3_approverId) $missingLevels[] = "ผู้ตรวจสอบ (1)";
                        if (!$level4_approverId) $missingLevels[] = "ผู้ตรวจสอบ (2)";
                        if (!$level5_approverId) $missingLevels[] = "ผู้อนุมัติ";
    
                        if (!empty($missingLevels)) {
                            throw new \Exception("ไม่สามารถบันทึกได้ เนื่องจากยังไม่ได้กำหนดข้อมูลผู้ตรวจสอบของใบเบิกค่าเดินทางในระบบ: " . implode(', ', $missingLevels));
                        }
    
                        $model->code = $this->generateNextExpenseCode();
                        
                        if (!$model->save(false)) {
                            throw new \Exception('บันทึกคำขอเบิกไม่สำเร็จ');
                        }
                        
                        foreach ($modelsItem as $item) {
                            $item->travel_expense_id = $model->id;
                            if (!$item->save(false)) { throw new \Exception('บันทึกรายการย่อยไม่สำเร็จ'); }
                        }
                        
                        $uploadPath = 'uploads/signatures/travel-expense/';
                        $fullPath = Yii::getAlias('@webroot/' . $uploadPath);
                        FileHelper::createDirectory($fullPath, 0775, true);
                        
                        $approvalPostData = $postData['TravelExpenseApproval'] ?? $postData['ExpenseApproval'] ?? [];
                        
                        foreach ($modelsApproval as $approvalModel) {
                            $approvalModel->travel_expense_id = $model->id;
                            $level = $approvalModel->level;
                            $field_name = $this->signatureMap[$level];
                            
                            if ($level == 2) $approvalModel->approver_id = $level2_approverId;
                            elseif ($level == 3) $approvalModel->approver_id = $level3_approverId;
                            elseif ($level == 4) $approvalModel->approver_id = $level4_approverId;
                            elseif ($level == 5) $approvalModel->approver_id = $level5_approverId;
                            
                            $signatureData = $approvalPostData[$level]['signature'] ?? null;
                            $isBase64Data = !empty($signatureData) && \str_starts_with($signatureData, 'data:image/png;base64,');
                            $uploadedFile = \yii\web\UploadedFile::getInstanceByName('SignatureUpload[' . $field_name . ']');
                            $isSignedDataPresent = $isBase64Data || $uploadedFile;
                        
                            if ($level == 1) {
                                $approvalModel->status = 'approved';
                                $approvalModel->approved_at = date('Y-m-d H:i:s');
                                $approvalModel->approver_id = $model->requestor_id;
                        
                                if ($isSignedDataPresent) {
                                    $fileName = $field_name . '-' . $model->id . '-' . time() . '-' . $level;
                                    if ($isBase64Data) {
                                        $base64Parts = explode(',', $signatureData);
                                        file_put_contents($fullPath . $fileName . '.png', base64_decode(end($base64Parts)));
                                        $approvalModel->expense_approval_path = $uploadPath . $fileName . '.png';
                                    } elseif ($uploadedFile) {
                                        $fileName .= '.' . $uploadedFile->extension;
                                        $uploadedFile->saveAs($fullPath . $fileName);
                                        $approvalModel->expense_approval_path = $uploadPath . $fileName;
                                    }
                                } elseif (!empty($signatureData) && !\str_starts_with($signatureData, 'data:')) {
                                    $sourcePath = Yii::getAlias('@webroot/') . ltrim($signatureData, '/');
                                    if (file_exists($sourcePath)) {
                                        $ext = pathinfo($sourcePath, PATHINFO_EXTENSION);
                                        $newFileName = $field_name . '-' . $model->id . '-' . time() . '-' . $level . '.' . $ext;
                                        if (copy($sourcePath, $fullPath . $newFileName)) {
                                            $approvalModel->expense_approval_path = $uploadPath . $newFileName;
                                        }
                                    }
                                }
                        
                                if (empty($approvalModel->expense_approval_path)) {
                                    throw new \Exception('ต้องมีการลงนามผู้ขอเบิกก่อนบันทึกรายการ');
                                }

                                $saveFlag = $postData['sign_save_' . $field_name] ?? null;

                                if ($saveFlag === 'save' && $isSignedDataPresent && $approvalModel->expense_approval_path) {
                                    $userSign = User::findOne($approvalModel->approver_id);
                                    if ($userSign) {
                                        $usignPath = ltrim($approvalModel->expense_approval_path, '/');
                                        $source = realpath(Yii::getAlias('@webroot/') . $usignPath);
                                        if ($source && file_exists($source)) {
                                            $targetDir = Yii::getAlias('@webroot/uploads/profile/');
                                            \yii\helpers\FileHelper::createDirectory($targetDir);
                                            $newFileName = uniqid('sign_', true) . '.' . pathinfo($source, PATHINFO_EXTENSION);
                                            if (copy($source, $targetDir . $newFileName)) {
                                                $userSign->signature_path = 'uploads/profile/' . $newFileName;
                                                $userSign->save(false);
                                            }
                                        }
                                    }
                                }

                            } else {
                                $approvalModel->expense_approval_path = null;
                                $approvalModel->status = 'pending';
                                $approvalModel->approved_at = null;
                            }
                            
                            if (!$approvalModel->save(false)) {
                                throw new \Exception('บันทึกข้อมูลการอนุมัติ Level ' . $level . ' ไม่สำเร็จ');
                            }
                        }
                        
                        $transaction->commit();
                        Yii::$app->session->setFlash('success', 'บันทึกข้อมูลใบเบิกค่าเดินทางสำเร็จ');
                        return $this->redirect(['update', 'id' => $model->id]);
                    } catch (\Exception $e) {
                        $transaction->rollBack();
                        $model->code = '-';
                        Yii::$app->session->setFlash('error', $e->getMessage());
                    }
                } else {
                    Yii::$app->session->setFlash('error', 'กรุณาตรวจสอบข้อมูลและลงนามผู้ขอเบิกให้ถูกต้อง');
                }
            }
        }

        $signaturesData = [];
        $currentUser = Yii::$app->user->identity;
        if ($currentUser && !empty($currentUser->signature_path)) {
            $signaturesData[1] = [
                'signature' => '/' . ltrim($currentUser->signature_path, '/'),
                'name' => $currentUser->fullName,
                'date' => date('d/m/Y'),
                'status' => 'approved'
            ];
        }
        
        return $this->render('create', [
            'model' => $model, 
            'modelsItem' => $modelsItem, 
            'users' => $users, 
            'payToUsers' => $users,
            'payees' => $users,
            'departments' => $departments, 
            'projects' => $projects, 
            'positions' => $positions,
            'usersData' => $usersData, 
            'payeesData' => $usersData, 
            'projectsJson' => $projectsJson,
            'modelItem' => $modelItem, 
            'modelsApproval' => $modelsApproval,
            'signaturesData' => $signaturesData,
        ]);
    }

    protected function prepareApprovalModels($model)
    {
        $modelsApproval = [];
        $isNewRecord = $model->isNewRecord;

        if (!$isNewRecord) {
            $modelsApproval = TravelExpenseApproval::find()
                ->where(['travel_expense_id' => $model->id])
                ->orderBy(['level' => SORT_ASC])
                ->all();
        }

        if (empty($modelsApproval)) {
            for ($level = 1; $level <= 5; $level++) {
                $approval = new TravelExpenseApproval();
                $approval->level = $level;
                $approval->status = 0;
                $modelsApproval[] = $approval;
            }
        }

        return $modelsApproval;
    }

    public function actionUpdate($id)
    {
        $model = $this->findModel($id);
        $modelsItem = $model->travelExpenseItems;
        $modelsApprovalRaw = $this->prepareApprovalModels($model);
        
        $modelsApproval = [];
        $signaturesData = [];
    
        $validatorApprovers = [
            3 => SettingValidator::find()->where(['doc_type' => 'TRAVEL-EXPENSE', 'level' => 3])->select('employee_id')->scalar(),
            4 => SettingValidator::find()->where(['doc_type' => 'TRAVEL-EXPENSE', 'level' => 4])->select('employee_id')->scalar(),
            5 => SettingValidator::find()->where(['doc_type' => 'TRAVEL-EXPENSE', 'level' => 5])->select('employee_id')->scalar(),
        ];
        
        foreach ($modelsApprovalRaw as $approval) {
            if (in_array($approval->level, [3, 4, 5]) && empty($approval->approver_id)) {
                $approval->approver_id = $validatorApprovers[$approval->level] ?: null;
            }
        
            $currentUserId = Yii::$app->user->id;
            $isMyQueue = false;
            
            if ($model->status == Constant::STATUS_EXPENSE_DRAFT && $approval->level == 1) $isMyQueue = true;
            if ($model->status == Constant::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER && $approval->level == 2) $isMyQueue = true;
            if ($model->status == Constant::STATUS_EXPENSE_WAITING_CHECKER && $approval->level == 3) $isMyQueue = true;
            if ($model->status == Constant::STATUS_EXPENSE_WAITING_MANAGER_CHECKER && $approval->level == 4) $isMyQueue = true;
            if ($model->status == Constant::STATUS_EXPENSE_WAITING_APPROVER && $approval->level == 5) $isMyQueue = true;

            $displaySignature = $approval->expense_approval_path;
            $displayDate = $approval->approved_at;
            $displayStatus = $approval->status;

            if ($approval->status == ExpenseApproval::STATUS_PENDING) {
                $displayDate = null;
                
                if ($isMyQueue && $approval->approver_id == $currentUserId) {
                    $currentUser = User::findOne($currentUserId);
                    if ($currentUser && !empty($currentUser->signature_path)) {
                        $displaySignature = '/' . ltrim($currentUser->signature_path, '/');
                    }
                } else {
                    $displaySignature = null;
                }
            }

            if ($model->status == 6 && $approval->level > 1) {
                $displaySignature = null;
                $displayDate = null;
                $displayStatus = ExpenseApproval::STATUS_PENDING;
            }
        
            $modelsApproval[$approval->level] = $approval;
            $signaturesData[$approval->level] = [
                'name' => ($approval->approver) ? $approval->approver->getFullName() : '-',
                'date' => $displayDate,
                'status' => $displayStatus,
                'signature' => $displaySignature,
                'remark' => $approval->remark,
                'approver_id' => $approval->approver_id
            ];
        }
    
        $usersModel = User::find()->where(['status' => User::STATUS_ACTIVE])->with('position')->all();
        $projectsModel = Project::find()->all();
        $departmentsModel = Department::find()->all();
        $positionsModel = Position::find()->all();
    
        $users = ArrayHelper::map($usersModel, 'id', 'fullName');
        $departments = ArrayHelper::map($departmentsModel, 'id', 'name');
        $positions = ArrayHelper::map($positionsModel, 'id', 'name');
    
        $usersData = ArrayHelper::map($usersModel, 'id', function ($user) {
            return [
                'department_id' => $user->position->department_id ?? null,
                'position_id' => $user->position_id,
                'bank_no' => $user->bank_no,
                'bank_branch' => $user->bank_branch,
            ];
        });
    
        $projects = ArrayHelper::map($projectsModel, 'id', function ($project) {
            return $project->code . ' ' . $project->name;
        });
        
        $projectsJson = json_encode(ArrayHelper::map($projectsModel, 'id', function ($project) {
            return ['id' => $project->id, 'name' => $project->name, 'code' => $project->code];
        }));
    
        $modelItem = !empty($modelsItem) ? $modelsItem[0] : new TravelExpenseItem();
        $level3Approvers = SettingValidator::getApproversByDocTypeAndLevel('TRAVEL-EXPENSE', 3);
        $level5Approvers = SettingValidator::getApproversByDocTypeAndLevel('TRAVEL-EXPENSE', 5);
    
        if (Yii::$app->request->isPost) {
            $postData = Yii::$app->request->post();
            $action = Yii::$app->request->post('action');
    
            if (isset($postData['TravelExpense']['request_date']) && !empty($postData['TravelExpense']['request_date'])) {
                $date = \DateTime::createFromFormat('d/m/Y', $postData['TravelExpense']['request_date']);
                if ($date) {
                    $postData['TravelExpense']['request_date'] = $date->format('Y-m-d');
                }
            }

            if (isset($postData['TravelExpense']['cheque_date']) && !empty($postData['TravelExpense']['cheque_date'])) {
                $date = \DateTime::createFromFormat('d/m/Y', $postData['TravelExpense']['cheque_date']);
                if ($date) { 
                    $postData['TravelExpense']['cheque_date'] = $date->format('Y-m-d'); 
                }
            }
    
            if (isset($postData['TravelExpense'])) {
                $numericFields = ['sub_total', 'total_vat', 'total_wht', 'total_net', 'total_receipt_amount', 'total_mileage_expense', 'total_other_expense', 'total_grand'];
                foreach ($numericFields as $field) {
                    if (isset($postData['TravelExpense'][$field])) {
                        $postData['TravelExpense'][$field] = str_replace(',', '', $postData['TravelExpense'][$field]);
                    }
                }
            }
    
            $oldItemIDs = ArrayHelper::map($modelsItem, 'id', 'id');
            $modelsItem = self::createMultiple(TravelExpenseItem::class, $modelsItem);
            Model::loadMultiple($modelsItem, $postData);
    
            $itemKey = 'TravelExpenseItem';
            if (isset($postData[$itemKey]) && is_array($postData[$itemKey])) {
                $itemNumericFields = ['amount', 'distance', 'travel_price', 'other_items_price', 'starting_mileage', 'end_mileage'];
                foreach ($modelsItem as $i => $item) {
                    if (isset($postData[$itemKey][$i]['item_date']) && !empty($postData[$itemKey][$i]['item_date'])) {
                        $date = \DateTime::createFromFormat('d/m/Y', $postData[$itemKey][$i]['item_date']);
                        if ($date) {
                            $item->item_date = $date->format('Y-m-d');
                        }
                    }
                    foreach ($itemNumericFields as $field) {
                        if (isset($postData[$itemKey][$i][$field])) {
                            $item->$field = str_replace(',', '', $postData[$itemKey][$i][$field]);
                        }
                    }
                }
            }
    
            $deletedIDs = array_diff($oldItemIDs, array_filter(ArrayHelper::map($modelsItem, 'id', 'id')));
            $oldStatus = $model->getOldAttribute('status');
            $model->load($postData);

            if ($model->payment_method === 'cash' || $model->payment_method === 'credit') {
                $model->transfer_account_number = null;
                $model->transfer_bank_branch = null;
                $model->cheque_bank_branch = null;
                $model->cheque_date = null;
            } elseif ($model->payment_method === 'bank_transfer') {
                $model->cheque_bank_branch = null;
                $model->cheque_date = null;
            } elseif ($model->payment_method === 'cheque_bank') {
                $model->transfer_account_number = null;
                $model->transfer_bank_branch = null;
            }

            if (!empty($action)) {
                switch ($action) {
                    case 'send_manager_approve':
                        $model->status = Constant::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER;
                        break;
                    case 'send_veridate_check_approve':
                        $model->status = Constant::STATUS_EXPENSE_WAITING_CHECKER;
                        break;
                    case 'send_veridate_manage_check_approve':
                        $model->status = Constant::STATUS_EXPENSE_WAITING_MANAGER_CHECKER;
                        break;
                    case 'send_veridate_approver':
                        $model->status = Constant::STATUS_EXPENSE_WAITING_APPROVER;
                        break;
                    case 'reject_document':
                        $model->status = Constant::STATUS_EXPENSE_REJECTED;
                        break;
                    case 'save_draft':
                        $model->status = Constant::STATUS_EXPENSE_DRAFT;
                        break;
                }
            }
            
            $modelsItem = array_filter($modelsItem, function ($m) {
                return !empty($m->description) || (float)$m->amount > 0;
            });
    
            if ($model->validate() && Model::validateMultiple($modelsItem)) {
                $transaction = Yii::$app->db->beginTransaction();
                try {
                    if ($oldStatus == Constant::STATUS_EXPENSE_REJECTED) {
                        if ($action !== 'save_draft') {
                            $model->status = Constant::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER;
                        }
                        $employeeModel = User::findOne($model->employee_id);
                        $deptId = ($employeeModel && $employeeModel->position) ? $employeeModel->position->department_id : null;
                        $newManagerId = $deptId ? Department::find()->where(['id' => $deptId])->select('manager_id')->scalar() : null;
                        
                        TravelExpenseApproval::updateAll(
                            [
                                'status' => 'pending', 
                                'approved_at' => null, 
                                'remark' => null, 
                                'expense_approval_path' => null,
                                'approver_id' => $newManagerId
                            ],
                            ['travel_expense_id' => $model->id, 'level' => 2]
                        );
                    
                        foreach ([3, 4, 5] as $lv) {
                            TravelExpenseApproval::updateAll(
                                [
                                    'status' => 'pending', 
                                    'approved_at' => null, 
                                    'remark' => null, 
                                    'expense_approval_path' => null,
                                    'approver_id' => $validatorApprovers[$lv] ?: null
                                ],
                                ['travel_expense_id' => $model->id, 'level' => $lv]
                            );
                        }
                    }
    
                    if (!$model->save(false)) throw new \Exception('Save error');
                    
                    if (!empty($deletedIDs)) {
                        TravelExpenseItem::deleteAll(['id' => $deletedIDs]);
                    }
                    
                    foreach ($modelsItem as $item) {
                        $item->travel_expense_id = $model->id;
                        if (!$item->save(false)) throw new \Exception('Item save error');
                    }
    
                    $uploadPath = 'uploads/signatures/travel-expense/';
                    $fullPath = Yii::getAlias('@webroot/' . $uploadPath);
                    FileHelper::createDirectory($fullPath, 0775, true);
    
                    if (isset($postData['TravelExpenseApproval'])) {
                        foreach ($postData['TravelExpenseApproval'] as $level => $approvalData) {
                            $approvalModel = TravelExpenseApproval::findOne(['travel_expense_id' => $model->id, 'level' => $level]) ?: new TravelExpenseApproval(['travel_expense_id' => $model->id, 'level' => $level]);
                        
                            if (in_array($level, [3, 4, 5])) {
                                $approvalModel->approver_id = $validatorApprovers[$level] ?: $approvalModel->approver_id;
                            } elseif (isset($approvalData['approver_id'])) {
                                $approvalModel->approver_id = $approvalData['approver_id'];
                            }
                        
                            $field_name = $this->signatureMap[$level] ?? null;
                            if (!$field_name) continue;
                        
                            $signatureData = $approvalData['signature'] ?? null;
                            $isBase64Data = !empty($signatureData) && str_starts_with($signatureData, 'data:image/png;base64,');
                            $uploadedFile = \yii\web\UploadedFile::getInstanceByName('SignatureUpload[' . $field_name . ']');
                            $hasNewSignature = $isBase64Data || $uploadedFile;
                            $inputStatus = isset($approvalData['status']) ? (string)$approvalData['status'] : null;
                    
                            if ($inputStatus === null && $hasNewSignature) {
                                $inputStatus = '1';
                            }
                    
                            if ($inputStatus === null && $approvalModel->status === 'pending') {
                                continue;
                            }
                    
                            if ($approvalModel->status === 'approved' || $approvalModel->status === 'rejected') {
                                continue;
                            }
                    
                            if ($inputStatus === '0') {
                                $approvalModel->status = 'rejected';
                                $approvalModel->approved_at = date('Y-m-d H:i:s');
                    
                                if (!empty($approvalModel->expense_approval_path)) {
                                    $cleanPath = ltrim($approvalModel->expense_approval_path, '/');
                                    $oldFilePath = Yii::getAlias('@webroot/') . $cleanPath;
                                    if (file_exists($oldFilePath)) @unlink($oldFilePath);
                                    $approvalModel->expense_approval_path = null;
                                }
                    
                                $model->status = Constant::STATUS_EXPENSE_REJECTED;
                                for ($prevLevel = 2; $prevLevel < $level; $prevLevel++) {
                                    $prevApproval = TravelExpenseApproval::findOne(['travel_expense_id' => $model->id, 'level' => $prevLevel]);
                                    if ($prevApproval) {
                                        $prevPath = $prevApproval->expense_approval_path;
                                        if (!empty($prevPath)) {
                                            $cleanPrevPath = ltrim($prevPath, '/');
                                            $prevFile = Yii::getAlias('@webroot/') . $cleanPrevPath;
                                            if (file_exists($prevFile)) @unlink($prevFile);
                                        }
                                        $prevApproval->status = 'pending';
                                        $prevApproval->approved_at = null;
                                        $prevApproval->expense_approval_path = null;
                                        $prevApproval->remark = null;
                                        $prevApproval->save(false);
                                    }
                                }
                    
                            } else {
                                if ($hasNewSignature) {
                                    if (!empty($approvalModel->expense_approval_path)) {
                                        $cleanPath = ltrim($approvalModel->expense_approval_path, '/');
                                        $oldFilePath = Yii::getAlias('@webroot/') . $cleanPath;
                                        if (file_exists($oldFilePath)) @unlink($oldFilePath);
                                    }
                    
                                    $fileName = $field_name . '-' . $model->id . '-' . time() . '-' . $level;
                                    if ($isBase64Data) {
                                        $base64Parts = explode(',', $signatureData);
                                        file_put_contents($fullPath . $fileName . '.png', base64_decode(end($base64Parts)));
                                        $approvalModel->expense_approval_path = $uploadPath . $fileName . '.png';
                                    } elseif ($uploadedFile) {
                                        $fileName .= '.' . $uploadedFile->extension;
                                        $uploadedFile->saveAs($fullPath . $fileName);
                                        $approvalModel->expense_approval_path = $uploadPath . $fileName;
                                    }
                                    $approvalModel->approved_at = date('Y-m-d H:i:s');
                    
                                } elseif ($inputStatus === '1' && empty($approvalModel->expense_approval_path)) {
                                    $currentUser = User::findOne($approvalModel->approver_id);
                                    if ($currentUser && !empty($currentUser->signature_path)) {
                                        $sourcePath = Yii::getAlias('@webroot/') . ltrim($currentUser->signature_path, '/');
                                        if (file_exists($sourcePath)) {
                                            $ext = pathinfo($sourcePath, PATHINFO_EXTENSION);
                                            $newFileName = $field_name . '-' . $model->id . '-' . time() . '-' . $level . '.' . $ext;
                                            if (copy($sourcePath, $fullPath . $newFileName)) {
                                                $approvalModel->expense_approval_path = $uploadPath . $newFileName;
                                                $approvalModel->approved_at = date('Y-m-d H:i:s');
                                            }
                                        }
                                    }
                                }
                    
                                $approvalModel->status = 'approved';
                    
                                if ($hasNewSignature || !empty($approvalModel->expense_approval_path)) {
                                    if ($level == 5) {
                                        $model->status = Constant::STATUS_EXPENSE_APPROVED;
                                    } else {
                                        $model->status = (int)$level;
                                    }
                    
                                    $saveFlag = $postData['sign_save_' . $field_name] ?? null;
                    
                                    if ($saveFlag === 'save' && $hasNewSignature && !empty($approvalModel->expense_approval_path)) {
                                        $userSign = User::findOne($approvalModel->approver_id);
                                        if ($userSign) {
                                            $usignPath = ltrim($approvalModel->expense_approval_path, '/');
                                            $source = realpath(Yii::getAlias('@webroot') . '/' . $usignPath);
                                            if ($source && file_exists($source)) {
                                                $targetDir = Yii::getAlias('@webroot/uploads/profile/');
                                                \yii\helpers\FileHelper::createDirectory($targetDir);
                                                $newFileName = uniqid('sign_', true) . '.' . pathinfo($source, PATHINFO_EXTENSION);
                                                if (copy($source, $targetDir . $newFileName)) {
                                                    $userSign->signature_path = 'uploads/profile/' . $newFileName;
                                                    $userSign->save(false);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        
                            if (isset($approvalData['remark'])) {
                                $approvalModel->remark = $approvalData['remark'];
                            }
                        
                            if (!$approvalModel->save(false)) throw new \Exception('Approval save error');
                        }
                        $model->save(false);
                    }
    
                    $transaction->commit();
                    Yii::$app->session->setFlash('success', 'บันทึกข้อมูลเรียบร้อยแล้ว');
                    return $this->redirect(['update', 'id' => $model->id]);
                } catch (\Exception $e) {
                    $transaction->rollBack();
                    Yii::$app->session->setFlash('error', $e->getMessage());
                }
            }
        }
    
        return $this->render('update', [
            'model' => $model,
            'modelsItem' => (empty($modelsItem)) ? [new TravelExpenseItem()] : $modelsItem,
            'users' => $users,
            'payees' => $users,
            'payToUsers' => $users,
            'departments' => $departments,
            'projects' => $projects,
            'positions' => $positions,
            'usersData' => $usersData,
            'payeesData' => $usersData,
            'projectsJson' => $projectsJson,
            'modelItem' => $modelItem,
            'modelsApproval' => $modelsApproval,
            'signaturesData' => $signaturesData,
            'level3Approvers' => $level3Approvers,
            'level5Approvers' => $level5Approvers,
        ]);
    }
    
    public function actionChangeStatus()
    {
        \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
    
        if (!\Yii::$app->request->isPost) {
            return ['success' => false, 'message' => 'คำขอไม่ถูกต้อง (ต้องเป็น POST)'];
        }
    
        $id = \Yii::$app->request->post('id');
        $newStatus = \Yii::$app->request->post('status');
    
        $expense = \app\models\TravelExpense::findOne($id); 
    
        if ($expense === null) {
            return ['success' => false, 'message' => 'ไม่พบรายการใบเบิกค่าเดินทาง ID: ' . $id];
        }
    
        $transaction = \Yii::$app->db->beginTransaction();
        try {
            $expense->status = $newStatus;
            $expense->updated_at = date('Y-m-d H:i:s');
            $expense->updated_by = \Yii::$app->user->isGuest ? null : \Yii::$app->user->id; 
    
            if ($expense->save(false)) { 
                $transaction->commit();
                return ['success' => true, 'message' => 'เปลี่ยนสถานะเรียบร้อยแล้ว'];
            } else {
                $transaction->rollBack();
                return ['success' => false, 'message' => 'ไม่สามารถบันทึกสถานะได้'];
            }
        } catch (\Exception $e) {
            $transaction->rollBack();
            \Yii::error($e->getMessage(), __METHOD__);
            return ['success' => false, 'message' => 'เกิดข้อผิดพลาดของระบบ: ' . $e->getMessage()]; 
        }
    }

    public function actionExport()
    {
        $setYear = (isset($_GET['selectYear']) && $_GET['selectYear'] != '') ? $_GET['selectYear'] : date("Y");
        $query = TravelExpense::find()->with(['requestor', 'employee', 'department']);
    
        if ($setYear != 'all') {
            $query->andWhere('DATE_FORMAT(' . TravelExpense::tableName() . '.request_date, "%Y") = :year', [':year' => $setYear]);
        }
    
        $query->orderBy(['created_at' => SORT_DESC]);
        $models = $query->all();
        
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $worksheet = $spreadsheet->getActiveSheet();
        
        $headers = [
            'A1' => 'ลำดับ',
            'B1' => 'เลขที่ใบเบิกเดินทาง',
            'C1' => 'วันที่เบิก',
            'D1' => 'ผู้ขอให้ดำเนินการ',
            'E1' => 'จ่ายให้ (ผู้รับเงิน)',
            'F1' => 'แผนก',
            'G1' => 'วัตถุประสงค์',
            'H1' => 'รวมใบเสร็จค่าน้ำมัน,ค่าไฟฟ้า (ระบุ)',
            'I1' => 'รวมค่าเดินทางตามระยะทาง',
            'J1' => 'รวมค่าใช้จ่ายอื่นๆ',
            'K1' => 'รวมค่าใช้จ่ายทั้งหมด',
            'L1' => 'สถานะ',
            'M1' => 'วันที่สร้าง',
            'N1' => 'วันที่อนุมัติล่าสุด',
        ];
    
        foreach ($headers as $cell => $value) {
            $worksheet->getCell($cell)->setValue($value);
            $worksheet->getStyle($cell)->getFont()->setBold(true);
        }
        
        $rowNum = 2;
        foreach ($models as $item) {
            $statusKey = $item->status ?? '';
            $statusText = \app\libs\Constant::STATUS_EXPENSE[$statusKey] ?? 'ไม่ทราบสถานะ';
            
            $createdDate = date('d/m/Y H:i:s', strtotime($item->created_at));
            $approvedDate = (!empty($item->approved_at)) ? date('d/m/Y H:i:s', strtotime($item->approved_at)) : '';
    
            $worksheet->getCell('A' . $rowNum)->setValue($rowNum - 1);
            $worksheet->getCell('B' . $rowNum)->setValue($item->code);
            $worksheet->getCell('C' . $rowNum)->setValue(date('d/m/Y', strtotime($item->request_date)));
            $worksheet->getCell('D' . $rowNum)->setValue($item->requestor ? $item->requestor->getFullName() : '');
            $worksheet->getCell('E' . $rowNum)->setValue($item->employee ? $item->employee->getFullName() : '');
            $worksheet->getCell('F' . $rowNum)->setValue($item->department ? $item->department->name : '');
            $worksheet->getCell('G' . $rowNum)->setValue($item->purpose);
            $worksheet->getCell('H' . $rowNum)->setValue($item->total_receipt_amount);
            $worksheet->getCell('I' . $rowNum)->setValue($item->total_mileage_expense);
            $worksheet->getCell('J' . $rowNum)->setValue($item->total_other_expense);
            $worksheet->getCell('K' . $rowNum)->setValue($item->total_grand);
            $worksheet->getCell('L' . $rowNum)->setValue($statusText);
            $worksheet->getCell('M' . $rowNum)->setValue($createdDate);
            $worksheet->getCell('N' . $rowNum)->setValue($approvedDate);
    
            $worksheet->getStyle('H'.$rowNum.':K'.$rowNum)->getNumberFormat()->setFormatCode('#,##0.00');
    
            $rowNum++;
        }
    
        foreach (range('A', 'N') as $columnID) {
            $worksheet->getColumnDimension($columnID)->setAutoSize(true);
        }
    
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = 'travel-expense-' . date('Ymd-His') . '.xlsx';
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        $writer->save('php://output');
        exit;
    }

    public function actionPdf($id)
    {
        $model = TravelExpense::findOne($id); 
        if (!$model) {
            throw new \yii\web\NotFoundHttpException('Requested page not found.');
        }

        $setDoc = SettingDocument::find()
        ->where(['doc_type' => 'TRAVEL-EXPENSE', 'type' => 'DOCUMENT_CODE'])
        ->one();

        if (!$setDoc || empty(trim($setDoc->value))) {
            Yii::$app->session->setFlash('error', 'ยังไม่ได้ตั้งค่ารหัสเอกสารในระบบ กรุณาตรวจสอบการตั้งค่า');
            return $this->redirect(Yii::$app->request->referrer ?: ['index']);
        }

        $headerHeight = 25;
        $css = file_get_contents(Yii::getAlias('@webroot') . '/css/print/expense.css');
        $setDoc = SettingDocument::find()->where(['doc_type' => 'TRAVEL-EXPENSE', 'type' => 'DOCUMENT_CODE'])->one();

        $mpdf = new \Mpdf\Mpdf([
            'tempDir' => Yii::getAlias('@runtime/mpdf'),
            'mode' => 'utf-8',
            'format' => 'A4-L',
            'default_font' => 'thsarabun',
            'margin_top' => 25,
            'margin_header' => 7,
            'margin_bottom' => 8,
            'margin_left' => 10,
            'margin_right' => 10,
            'fontDir' => array_merge((new \Mpdf\Config\ConfigVariables())->getDefaults()['fontDir'], [
                Yii::getAlias('@webroot/fonts') . '/Sarabun',
                Yii::getAlias('@webroot/fonts') . '/THSarabunNew'
            ]),
            'fontdata' => array_merge((new \Mpdf\Config\FontVariables())->getDefaults()['fontdata'], [
                'thsarabun' => [
                    'R' => 'THSarabunNew.ttf', 'B' => 'THSarabunNewBold.ttf',
                    'I' => 'THSarabunNewItalic.ttf', 'BI' => 'THSarabunNewBoldItalic.ttf',
                ]
            ]),
        ]);

        $purpose = Yii::$app->forms->splitTextByWidth($mpdf, trim($model->purpose), 110, 'thsarabun', 9);
        $tp = (isset($purpose['line_count']) && $purpose['line_count'] > 3) ? implode('', array_slice($purpose['lines'], 0, 3)) . '...' : $model->purpose;
        $remark = Yii::$app->forms->splitTextByWidth($mpdf, trim($model->remark_short ?? ''), 40, 'thsarabun', 9);
        $tre = (isset($remark['line_count']) && $remark['line_count'] > 3) ? implode('', array_slice($remark['lines'], 0, 3)) . '...' : $model->remark_short;
        $setText = ['purpose' => $tp, 'remark_short' => $tre];

        $headerHTML = Yii::$app->forms->getTitlePDFExPageLandscape();
        $headerHTML = str_replace(
            ['[LOGO_URL]', '[TH_ADDRESS]', '[EN_ADDRESS]', '[DOC_CODE]', '[DOC_NO_TEXT]', '[DOC_NO]', '[DOC_NAME]', '[PAGE]', '[SUB_HEADER]'],
            [
                Yii::getAlias('@webroot') . '',
                Constant::MY_COMPANY_NAME_TH . ' ' . Constant::MY_COMPANY_ADDRESS2_TH,
                Constant::MY_COMPANY_NAME . ' ' . Constant::MY_COMPANY_ADDRESS2_EN,
                MyComponent::encodeDocCode($setDoc->value),
                'เลขที่/Travel No.', $model->code, 'ใบเบิกค่าใช้จ่ายในการเดินทางไปปฏิบัติงาน', 'Page {PAGENO} of {nbpg}', ''
            ],
            $headerHTML
        );

        $mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
        $mpdf->SetHTMLHeader($headerHTML);
        
        $items = \app\models\TravelExpenseItem::find()
            ->where(['travel_expense_id' => $id])
            ->orderBy(['item_date' => SORT_ASC])
            ->all();

        $html = $this->renderPartial('pdf', [
            'model' => $model,
            'items' => $items,
            'mpdf' => $mpdf,
            'setText' => $setText
        ]);

        $mpdf->WriteHTML($html, \Mpdf\HTMLParserMode::HTML_BODY);
        $mpdf->SetTitle('ใบเบิกค่าเดินทาง_' . $model->code);
        $mpdf->SetSubject('Travel Expense');
        $mpdf->SetAuthor(Constant::MY_COMPANY_NAME);
        
        $filename = "ใบเบิกค่าเดินทาง_" . $model->code . '.pdf';
        $mpdf->Output($filename, 'I');
    }

    
    public function actionDelete($id)
    {
        $model = $this->findModel($id);
        
        $transaction = Yii::$app->db->beginTransaction();
        try {
            TravelExpenseItem::deleteAll(['travel_expense_id' => $model->id]);
            
            if (!$model->delete()) {
                Yii::$app->session->setFlash('error', 'ไม่สามารถลบใบเบิกค่าเดินทางได้');
                throw new \Exception('Failed to delete TravelExpense.');
            }
            
            $transaction->commit();
            Yii::$app->session->setFlash('success', 'ลบใบเบิกค่าเดินทางเรียบร้อยแล้ว');
        } catch (\Exception $e) {
            $transaction->rollBack();
            Yii::error($e->getMessage());
            Yii::$app->session->setFlash('error', 'เกิดข้อผิดพลาดในการลบข้อมูล: ' . $e->getMessage());
        }

        return $this->redirect(['index']);
    }

    protected function findModel($id)
    {
        if (($model = TravelExpense::findOne(['id' => $id])) !== null) {
            return $model;
        }

        throw new NotFoundHttpException(Yii::t('app', 'The requested page does not exist.'));
    }

    public static function createMultiple($modelClass, $multipleModels = [])
    {
        $model    = new $modelClass;
        $formName = $model->formName();
        $post     = Yii::$app->request->post($formName);
        $models   = [];

        if (! empty($multipleModels)) {
            $keys = array_keys($multipleModels);
            if (! empty($post)) {
                $keys = array_keys($post);
            }
            foreach ($keys as $key) {
                if (isset($multipleModels[$key])) {
                    $models[$key] = $multipleModels[$key];
                } else {
                    $models[$key] = new $modelClass;
                }
            }
        } else {
            if (! empty($post)) {
                foreach ($post as $key => $value) {
                    $models[$key] = new $modelClass;
                }
            }
        }

        unset($model, $formName, $post);

        return $models;
    }

    protected function generateNextExpenseCode()
    {
        $prefix = 'TE' . date('ym');
    
        $lastRecord = \app\models\TravelExpense::find()
            ->where(['like', 'code', $prefix . '%', false])
            ->orderBy(['code' => SORT_DESC])
            ->one();
    
        $lastNumber = 0;
        if ($lastRecord) {
            $lastNumber = (int)substr($lastRecord->code, -2);
        }
    
        $nextNumber = str_pad($lastNumber + 1, 2, '0', STR_PAD_LEFT);
    
        return $prefix . $nextNumber;
    }
}