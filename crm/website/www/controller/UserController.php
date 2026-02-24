<?php

namespace app\controllers;

use app\components\MyComponent;
use app\models\AuthAssignment;
use app\models\AuthItem;
use app\models\Position;
use app\models\User;
use app\models\UserSearch;
use Yii;
use yii\filters\AccessControl;
use yii\helpers\ArrayHelper;
use yii\web\Controller;
use yii\web\NotFoundHttpException;
use yii\filters\VerbFilter;

/**
 * UserController implements the CRUD actions for User model.
 */
class UserController extends BaseController
{
    /**
     * @inheritDoc
     */
    public function behaviors()
    {
        return [
            'access' => [
                'class' => AccessControl::className(),
                'rules' => [
                    [
                        'actions' => ['profile'],
                        'allow' => true,
                        'roles' => ['@'],
                    ],
                    [
                        'allow' => true,
                        'roles' => ['manageUser'],
                    ],
                ],
            ],
            'verbs' => [
                'class' => VerbFilter::className(),
                'actions' => [
                    'delete' => ['post'],
                ],
            ],
        ];
    }

    /**
     * Lists all User models.
     *
     * @return string
     */
    public function actionIndex()
    {
        $searchModel = new UserSearch();
        // $searchModel->status = 10;
        $dataProvider = $searchModel->search($this->request->queryParams);
        $positionObj = Position::find()->all();
        $positions = ArrayHelper::map($positionObj, 'id', function ($model) {
            return 'Company: ' . $model->department->company->name . ' / Department: ' . $model->department->name . ' / Position: ' . $model->name;
        });
        natcasesort($positions);

        $authItemObj = AuthItem::find()->where(['type' => 1])->andWhere(['<>', 'name', 'Super_Admin'])->orderBy('name ASC')->all();
        $permissions = ArrayHelper::map($authItemObj, 'name', 'name');

        return $this->render('index', [
            'searchModel' => $searchModel,
            'dataProvider' => $dataProvider,
            'positions' => $positions,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Displays a single User model.
     * @param int $id
     * @return string
     * @throws NotFoundHttpException if the model cannot be found
     */
    public function actionView($id)
    {
        return $this->render('view', [
            'model' => $this->findModel($id),
        ]);
    }

    /**
     * Creates a new User model.
     * If creation is successful, the browser will be redirected to the 'view' page.
     * @return string|\yii\web\Response
     */
    public function actionCreate()
    {
        $model = new User();
        $model->scenario = User::SCENARIO_DEFAULT;

        if (Yii::$app->request->isPost && $model->load(Yii::$app->request->post(), '')) {

            $existingUser = User::find()->where(['email' => $model->email])->one();

            if ($existingUser) {
                $message = ($existingUser->status == User::STATUS_ACTIVE)
                    ? 'มีผู้ใช้อยู่ในระบบแล้ว โปรดตรวจสอบรายการผู้ใช้อีกครั้ง'
                    : 'ผู้ใช้สถานะไม่พร้อมใช้งาน โปรดตรวจสอบผู้ใช้ที่ <b>กู้คืนผู้ใช้งาน</b>';

                Yii::$app->session->setFlash('typeNoti', 'error');
                Yii::$app->session->setFlash('detailNoti', $message);
                return $this->redirect(['index']);
            }

            $transaction = Yii::$app->db->beginTransaction();

            try {
                $model->password_hash = Yii::$app->security->generatePasswordHash($model->password_hash);

                $model->auth_key = Yii::$app->security->generateRandomString();
                $model->status = User::STATUS_ACTIVE;

                if (!$model->save()) {
                    throw new \Exception(implode("<br>", ArrayHelper::getColumn($model->errors, 0)));
                }

                $auth = Yii::$app->authManager;
                $role = $auth->getRole($model->permission);

                if ($role) {
                    $auth->assign($role, $model->id);
                } else {

                    throw new \Exception("ไม่พบสิทธิ์การใช้งาน: " . $model->permission);
                }

                $transaction->commit();

                MyComponent::alertMsg(Yii::t('app', 'Success'), "success", Yii::t('app', 'Add Data Success'));
            } catch (\Exception $e) {
                $transaction->rollBack();
                throw $e;
            }
        }

        return $this->redirect(['index']);
    }


    /**
     * Updates an existing User model.
     * If update is successful, the browser will be redirected to the 'view' page.
     * @param int $id
     * @return string|\yii\web\Response
     * @throws NotFoundHttpException if the model cannot be found
     */
    public function actionUpdate($id)
    {
        $model = $this->findModel($id);

        if ($this->request->isPost && $model->load($this->request->post(), '')) {
            $transaction = Yii::$app->db->beginTransaction();
            try {
                if ($model->save()) {
                    AuthAssignment::deleteAll(['user_id' => $model->id]);

                    $authAssignment = new AuthAssignment();
                    $authAssignment->user_id = (string)$model->id;
                    $authAssignment->item_name = $model->permission;

                    if ($authAssignment->save()) {

                        $transaction->commit();

                        $title = Yii::t('app', 'Success');
                        $message = Yii::t('app', 'Update Data Success');
                        $type = 'success';
                    } else {

                        $transaction->rollBack();

                        $title = 'Fail';
                        $message = implode("<br />", \yii\helpers\ArrayHelper::getColumn($authAssignment->errors, 0, false));
                        $type = 'error';
                    }
                } else {
                    $transaction->rollBack();

                    $title = 'Fail';
                    $message = implode("<br />", \yii\helpers\ArrayHelper::getColumn($model->errors, 0, false));
                    $type = 'error';
                }
            } catch (\Exception $e) {
                $transaction->rollBack();
                throw $e;
            }
            Yii::$app->session->setFlash('titleNoti', $title);
            Yii::$app->session->setFlash('detailNoti', $message);
            Yii::$app->session->setFlash('typeNoti', $type);
        }


        return $this->redirect(['index']);
    }

    public function actionResetPassword($id)
    {
        $model = $this->findModel($id);
        if ($this->request->isPost && $model->load($this->request->post(), '')) {
            $model->password_hash = Yii::$app->security->generatePasswordHash($model->password_hash);
            $title = Yii::t('app', 'Success');
            $message = Yii::t('app', 'Update Data Success');
            $type = Yii::t('app', 'success');
            if (!$model->save()) {
                $title = 'Fail';
                $message = implode("<br />", \yii\helpers\ArrayHelper::getColumn($model->errors, 0, false));
                $type = 'error';
            }
            Yii::$app->session->setFlash('titleNoti', $title);
            Yii::$app->session->setFlash('detailNoti', $message);
            Yii::$app->session->setFlash('typeNoti', $type);
        }
        return $this->redirect(['index']);
    }

    /**
     * Deletes an existing User model.
     * If deletion is successful, the browser will be redirected to the 'index' page.
     * @param int $id
     * @return bool[]
     * @throws NotFoundHttpException if the model cannot be found
     */
    public function actionDelete($id)
    {
        \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
        if ($id > 0) {
            $model = $this->findModel($id);
            $model->status = User::STATUS_INACTIVE;
            $model->save();
        }

        return ['status' => true];
    }

    /**
     * Finds the User model based on its primary key value.
     * If the model is not found, a 404 HTTP exception will be thrown.
     * @param int $id
     * @return User the loaded model
     * @throws NotFoundHttpException if the model cannot be found
     */
    protected function findModel($id)
    {
        if (($model = User::findOne(['id' => $id])) !== null) {
            return $model;
        }

        throw new NotFoundHttpException('The requested page does not exist.');
    }

    public function actionDetail()
    {
        if (\Yii::$app->request->isAjax) {
            $data = $this->request->post();
            $id = $data['id'];
            $model = User::find()->where(['id' => $id])->asArray()->one();
            $authItem = AuthAssignment::find()->where(['user_id' => $id])->one();
            $model['permission'] = isset($authItem->item_name) ? $authItem->item_name : '';
            \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
            return [
                'data' => $model
            ];
        }
    }

    /**
     * Restore User model.
     * If deletion is successful, the browser will be redirected to the 'index' page.
     * @param int $id
     * @return bool[]
     * @throws NotFoundHttpException if the model cannot be found
     */
    public function actionRestore($id)
    {
        \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
        if ($id > 0) {
            $model = $this->findModel($id);
            $newPass = MyComponent::randomPassword();
            $model->status = User::STATUS_ACTIVE;
            $model->password_hash = Yii::$app->security->generatePasswordHash($newPass);
            $model->save();
        }

        return ['status' => true, 'newpassword' => $newPass];
    }

    public function actionProfile()
    {
        $model = $this->findModel(Yii::$app->user->id);
    
        if ($this->request->isPost) {
            $postData = $this->request->post();
            $sigType = $postData['sig_type'] ?? 'upload';
    
            if ($model->load($postData)) {
                $directory = 'uploads/signatures/profile/';
                if (!is_dir($directory)) {
                    mkdir($directory, 0777, true);
                }
    
                if ($sigType === 'draw') {
                    if (!empty($model->signature_base64)) {
                        $data = str_replace('data:image/png;base64,', '', $model->signature_base64);
                        $data = str_replace(' ', '+', $data);
                        $imageContent = base64_decode($data);
                        
                        $fileName = 'sig_' . $model->id . '_' . time() . '.png';
                        $filePath = $directory . $fileName;
    
                        if (file_put_contents($filePath, $imageContent)) {
                            $model->signature_path = $filePath;
                        }
                    } else {
                        $model->signature_path = $model->getOldAttribute('signature_path');
                    }
                } else {
                    $file = \yii\web\UploadedFile::getInstance($model, 'signature_path');
                    if ($file) {
                        $fileName = 'upload_' . $model->id . '_' . time() . '.' . $file->extension;
                        $filePath = $directory . $fileName;
                        if ($file->saveAs($filePath)) {
                            $model->signature_path = $filePath;
                        }
                    } else {
                        $model->signature_path = $model->getOldAttribute('signature_path');
                    }
                }
    
                if ($model->save()) {
                    Yii::$app->session->setFlash('titleNoti', 'สำเร็จ');
                    Yii::$app->session->setFlash('detailNoti', 'แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว');
                    Yii::$app->session->setFlash('typeNoti', 'success');
                    return $this->refresh();
                } else {
                    Yii::$app->session->setFlash('titleNoti', 'บันทึกไม่สำเร็จ');
                    $errorMsg = implode("<br />", \yii\helpers\ArrayHelper::getColumn($model->errors, 0, false));
                    Yii::$app->session->setFlash('detailNoti', 'การดำเนินการล้มเหลว: ' . $errorMsg);
                    Yii::$app->session->setFlash('typeNoti', 'error');
                }
            }
        }
    
        return $this->render('profile', [
            'model' => $model,
        ]);
    }
}
