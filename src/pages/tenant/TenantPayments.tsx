
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths, addMonths, isFuture, isPast } from "date-fns";
import { useTenantPortal } from "@/hooks/useTenantPortal";
import MakePaymentButton from "@/components/payments/MakePaymentButton";
import { useToast } from "@/hooks/use-toast";

const TenantPayments: React.FC = () => {
  const { isLoading, payments, rentAmount, balance, profile, leaseStart, leaseEnd } = useTenantPortal();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 3)),
    to: endOfMonth(new Date())
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState<Array<{date: Date, amount: number, status: string}>>([]);

  useEffect(() => {
    // Calculate upcoming payment dates based on lease duration
    if (leaseStart && leaseEnd && rentAmount) {
      const startDate = new Date(leaseStart);
      const endDate = new Date(leaseEnd);
      const today = new Date();
      
      // Generate upcoming payments for the next 3 months or until lease end
      const upcoming: Array<{date: Date, amount: number, status: string}> = [];
      let currentDate = today;
      
      // Find the next payment date (1st of next month or current month if before the 5th)
      let nextPaymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      if (currentDate.getDate() > 5) {
        nextPaymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
      
      // Generate up to 3 future payments
      for (let i = 0; i < 3; i++) {
        const paymentDate = i === 0 ? nextPaymentDate : addMonths(nextPaymentDate, i);
        
        // Check if payment date is within lease period
        if (paymentDate <= endDate) {
          const hasPayment = payments.some(payment => {
            const pDate = new Date(payment.date);
            return pDate.getMonth() === paymentDate.getMonth() && 
                   pDate.getFullYear() === paymentDate.getFullYear() &&
                   payment.status === 'completed';
          });
          
          upcoming.push({
            date: paymentDate,
            amount: rentAmount,
            status: hasPayment ? 'paid' : 'upcoming'
          });
        }
      }
      
      setUpcomingPayments(upcoming);
    }
  }, [leaseStart, leaseEnd, rentAmount, payments, refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'upcoming':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredPayments = () => {
    if (!payments || payments.length === 0) return [];
    
    return payments.filter(payment => {
      if (!dateRange.from) return true;
      try {
        const paymentDate = parseISO(payment.date);
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(paymentDate, { start: dateRange.from, end: dateRange.to });
        }
        return paymentDate >= dateRange.from;
      } catch (error) {
        return false;
      }
    });
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Payment recorded",
      description: "Your payment has been successfully recorded.",
    });
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // This will reload component data when refreshTrigger changes
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredPayments = getFilteredPayments();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-2">View and track your payments</p>
        </div>
        <MakePaymentButton 
          amount={balance > 0 ? balance : rentAmount} 
          onPaymentComplete={handlePaymentComplete} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(rentAmount)}</p>
            <p className="text-sm text-muted-foreground">Due on the 1st of each month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {formatCurrency(balance)}
            </p>
            <p className="text-sm text-muted-foreground">
              {balance > 0 ? 'Payment required' : 'All paid up'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
            <p className="text-sm text-muted-foreground">Total payments made</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payment Records</h3>
            <DateRangePicker date={dateRange} setDate={setDateRange} />
          </div>
          
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No payment records found for the selected period.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{formatDate(payment.date)}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {payment.method} {payment.notes && `- ${payment.notes}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{formatCurrency(payment.amount)}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your rent of {formatCurrency(rentAmount)} is due on the 1st of each month.
              </p>
              
              {upcomingPayments.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium">Upcoming Payments</h3>
                  {upcomingPayments.map((payment, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{format(payment.date, 'MMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">Monthly rent payment</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{formatCurrency(payment.amount)}</p>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-1">Payment Options</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Online payment through tenant portal (Credit/Debit Card)</li>
                    <li>Interac e-Transfer to property management</li>
                    <li>Check or money order delivered to management office</li>
                    <li>Automatic bank draft (contact property manager to set up)</li>
                  </ul>
                </div>
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-1">Late Payment Policy</h4>
                  <p className="text-sm">
                    Payments received after the 5th of the month are subject to a late fee of 5% of the monthly rent amount.
                    Contact your property manager if you anticipate difficulties making your payment on time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantPayments;
